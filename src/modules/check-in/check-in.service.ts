import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getGateAdmissionState, EventNotFoundError } from "@/modules/events";
import {
  hashValidationToken,
  normalizeManualCode,
  TicketCredentialError,
} from "@/modules/tickets/ticket-credentials";

import {
  consumeTicketAtomically,
  findTicketByManualCode,
  findTicketByValidationTokenHash,
  getCheckInEvent,
  recordNonConsumingValidation,
  type TicketForCheckIn,
} from "./check-in.repository";
import type {
  CheckInResult,
  ManualCheckInInput,
  QrCheckInInput,
} from "./check-in.types";
import { EventExpiredError, EventNotStartedError } from "./check-in.errors";

function ticketPresentation(ticket: TicketForCheckIn) {
  return {
    eventTitle: ticket.event.movieSnapshot.title,
    holderName: ticket.customer.name,
    seatLabel: ticket.eventSeat.label,
  };
}

export function createCheckInService(database: PrismaClient = db) {
  async function validateKnownOrUnknownTicket(
    gateUserId: string,
    eventId: string,
    ticket: TicketForCheckIn | null,
  ): Promise<CheckInResult> {
    const event = await getCheckInEvent(database, eventId);
    if (!event) {
      throw new EventNotFoundError();
    }

    const gateState = getGateAdmissionState(event.startsAt);
    if (gateState === "NOT_STARTED") {
      throw new EventNotStartedError();
    }
    if (gateState === "EXPIRED") {
      throw new EventExpiredError();
    }

    if (!ticket) {
      await recordNonConsumingValidation(database, {
        eventId,
        gateUserId,
        result: "INVALID",
        ticketId: null,
      });

      return { result: "INVALID" };
    }

    if (ticket.eventId !== eventId) {
      await recordNonConsumingValidation(database, {
        eventId,
        gateUserId,
        result: "WRONG_EVENT",
        ticketId: ticket.id,
      });

      return {
        result: "WRONG_EVENT",
        ticketEvent: {
          id: ticket.event.id,
          title: ticket.event.movieSnapshot.title,
        },
      };
    }

    const consumption = await consumeTicketAtomically(database, {
      eventId,
      gateUserId,
      ticketId: ticket.id,
    });

    if (consumption.result === "ALREADY_USED") {
      return {
        result: "ALREADY_USED",
        usedAt: consumption.usedAt.toISOString(),
      };
    }

    return {
      result: "VALID",
      ticket: ticketPresentation(ticket),
      validatedAt: consumption.validatedAt.toISOString(),
    };
  }

  return {
    async checkInByManualCode(
      gateUserId: string,
      input: ManualCheckInInput,
    ): Promise<CheckInResult> {
      let manualCode: string;

      try {
        manualCode = normalizeManualCode(input.code);
      } catch (error) {
        if (error instanceof TicketCredentialError) {
          return validateKnownOrUnknownTicket(gateUserId, input.eventId, null);
        }

        throw error;
      }

      return validateKnownOrUnknownTicket(
        gateUserId,
        input.eventId,
        await findTicketByManualCode(database, manualCode),
      );
    },

    async checkInByValidationToken(
      gateUserId: string,
      input: QrCheckInInput,
    ): Promise<CheckInResult> {
      let validationTokenHash: string;

      try {
        validationTokenHash = hashValidationToken(input.token);
      } catch (error) {
        if (error instanceof TicketCredentialError) {
          return validateKnownOrUnknownTicket(gateUserId, input.eventId, null);
        }

        throw error;
      }

      return validateKnownOrUnknownTicket(
        gateUserId,
        input.eventId,
        await findTicketByValidationTokenHash(database, validationTokenHash),
      );
    },
  };
}

const checkInService = createCheckInService();

export const checkInByManualCode = checkInService.checkInByManualCode;
export const checkInByValidationToken = checkInService.checkInByValidationToken;

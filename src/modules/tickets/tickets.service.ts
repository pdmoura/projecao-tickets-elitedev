import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getServerEnv } from "@/lib/env/server";

import {
  decryptValidationToken,
  formatManualCode,
  TicketCredentialError,
} from "./ticket-credentials";
import { renderTicketQr } from "./ticket-qr";
import { TicketNotFoundError } from "./tickets.errors";
import {
  findCustomerTicket,
  findSharedTicket,
  listCustomerTickets,
  rotateCustomerTicketShareToken,
} from "./tickets.repository";
import { generateShareToken, hashShareToken } from "./share-credentials";
import type { SharedTicketDetail, TicketDetail, TicketSummary } from "./tickets.types";

type TicketPresentationRecord = Awaited<
  ReturnType<typeof listCustomerTickets>
>[number];

function requirePresentationFields(record: TicketPresentationRecord) {
  if (
    !record.event.startsAt ||
    !record.event.roomName ||
    !record.event.venueName
  ) {
    throw new TicketNotFoundError();
  }

  return {
    roomName: record.event.roomName,
    startsAt: record.event.startsAt,
    venueName: record.event.venueName,
  };
}

function toTicketSummary(record: TicketPresentationRecord): TicketSummary {
  const event = requirePresentationFields(record);

  return {
    createdAt: record.createdAt.toISOString(),
    event: {
      id: record.event.id,
      movieTitle: record.event.movieSnapshot.title,
      posterPath: record.event.movieSnapshot.posterPath ?? "/placeholders/poster-unavailable.png",
      roomName: event.roomName,
      startsAt: event.startsAt.toISOString(),
      venueName: event.venueName,
    },
    id: record.id,
    seatLabel: record.eventSeat.label,
    status: record.usedAt ? "USED" : "AVAILABLE_FOR_ENTRY",
  };
}

async function toSharedTicketDetail(
  record: NonNullable<Awaited<ReturnType<typeof findSharedTicket>>>,
): Promise<SharedTicketDetail> {
  const validationToken = decryptValidationToken({
    validationTokenAuthTag: record.validationTokenAuthTag,
    validationTokenCiphertext: record.validationTokenCiphertext,
    validationTokenIv: record.validationTokenIv,
  });

  return {
    ...toTicketSummary(record),
    manualCode: formatManualCode(record.manualCode),
    qrDataUrl: await renderTicketQr(validationToken),
    unitPriceCents: record.reservationItem.unitPriceCents,
    usedAt: record.usedAt?.toISOString() ?? null,
  };
}

export function createTicketService(database: PrismaClient = db) {
  return {
    async getTicket(customerId: string, ticketId: string): Promise<TicketDetail> {
      const ticket = await findCustomerTicket(database, customerId, ticketId);

      if (!ticket) {
        throw new TicketNotFoundError();
      }

      const validationToken = decryptValidationToken({
        validationTokenAuthTag: ticket.validationTokenAuthTag,
        validationTokenCiphertext: ticket.validationTokenCiphertext,
        validationTokenIv: ticket.validationTokenIv,
      });

      return {
        ...toTicketSummary(ticket),
        holderName: ticket.customer.name,
        manualCode: formatManualCode(ticket.manualCode),
        qrDataUrl: await renderTicketQr(validationToken),
        unitPriceCents: ticket.reservationItem.unitPriceCents,
        usedAt: ticket.usedAt?.toISOString() ?? null,
      };
    },

    async listTickets(customerId: string): Promise<TicketSummary[]> {
      const tickets = await listCustomerTickets(database, customerId);

      return tickets.map(toTicketSummary);
    },

    async shareTicket(customerId: string, ticketId: string): Promise<{ url: string }> {
      const token = generateShareToken();
      const update = await rotateCustomerTicketShareToken(
        database,
        customerId,
        ticketId,
        hashShareToken(token),
      );

      if (update.count !== 1) {
        throw new TicketNotFoundError();
      }

      return {
        url: new URL(`/tickets/shared/${token}`, getServerEnv().APP_URL).toString(),
      };
    },

    async getSharedTicket(token: string): Promise<SharedTicketDetail> {
      let ticket;

      try {
        ticket = await findSharedTicket(database, hashShareToken(token));
      } catch (error) {
        if (error instanceof TicketCredentialError) {
          throw new TicketNotFoundError();
        }

        throw error;
      }

      if (!ticket) {
        throw new TicketNotFoundError();
      }

      return toSharedTicketDetail(ticket);
    },
  };
}

const ticketService = createTicketService();

export const getTicket = ticketService.getTicket;
export const listTickets = ticketService.listTickets;
export const shareTicket = ticketService.shareTicket;
export const getSharedTicket = ticketService.getSharedTicket;

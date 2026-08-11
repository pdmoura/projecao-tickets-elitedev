import "server-only";

import { randomUUID } from "node:crypto";

import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { EventNotFoundError } from "@/modules/events";

import { SeatUnavailableError } from "./checkout.errors";
import type { ApprovedCheckout } from "./checkout.types";
import type { StoredTicketCredentials } from "./ticket-credentials";

type LockedSeat = {
  eventId: string;
  id: string;
  label: string;
  status: "AVAILABLE" | "SOLD";
};

type PreparedTicket = StoredTicketCredentials & {
  eventSeatId: string;
};

function requirePositiveTotal(priceCents: number | null, seatCount: number): number {
  const totalCents = (priceCents ?? 0) * seatCount;

  if (!Number.isSafeInteger(totalCents) || totalCents <= 0) {
    throw new EventNotFoundError();
  }

  return totalCents;
}

export async function persistDeclinedPayment(
  database: PrismaClient,
  input: { customerId: string; eventId: string; seatIds: string[] },
): Promise<void> {
  const event = await database.event.findFirst({
    select: { priceCents: true },
    where: {
      id: input.eventId,
      startsAt: { gt: new Date() },
      status: "PUBLISHED",
    },
  });

  if (!event) {
    throw new EventNotFoundError();
  }

  const seatCount = await database.eventSeat.count({
    where: { eventId: input.eventId, id: { in: input.seatIds } },
  });

  if (seatCount !== input.seatIds.length) {
    throw new SeatUnavailableError(input.seatIds);
  }

  await database.payment.create({
    data: {
      amountCents: requirePositiveTotal(event.priceCents, input.seatIds.length),
      customerId: input.customerId,
      eventId: input.eventId,
      provider: "SIMULATOR",
      reference: `SIM-DECLINED-${randomUUID()}`,
      reservationId: null,
      status: "DECLINED",
    },
  });
}

export async function persistApprovedCheckout(
  database: PrismaClient,
  input: {
    customerId: string;
    eventId: string;
    seatIds: string[];
    tickets: PreparedTicket[];
  },
): Promise<ApprovedCheckout> {
  return database.$transaction(
    async (transaction) => {
      const event = await transaction.event.findFirst({
        select: { priceCents: true },
        where: {
          id: input.eventId,
          startsAt: { gt: new Date() },
          status: "PUBLISHED",
        },
      });

      if (!event) {
        throw new EventNotFoundError();
      }

      const lockedSeats = await transaction.$queryRaw<LockedSeat[]>(Prisma.sql`
        SELECT
          "id",
          "event_id" AS "eventId",
          "label",
          "status"::text AS "status"
        FROM "event_seat"
        WHERE "event_id" = ${input.eventId}
          AND "id" IN (${Prisma.join(input.seatIds)})
        ORDER BY "id"
        FOR UPDATE
      `);
      const lockedSeatById = new Map(lockedSeats.map((seat) => [seat.id, seat]));
      const unavailableSeatIds = input.seatIds.filter(
        (seatId) => lockedSeatById.get(seatId)?.status !== "AVAILABLE",
      );

      if (unavailableSeatIds.length > 0) {
        throw new SeatUnavailableError(
          unavailableSeatIds,
          unavailableSeatIds.flatMap((seatId) => {
            const label = lockedSeatById.get(seatId)?.label;
            return label ? [label] : [];
          }),
        );
      }

      const updatedSeats = await transaction.eventSeat.updateMany({
        data: { status: "SOLD" },
        where: {
          eventId: input.eventId,
          id: { in: input.seatIds },
          status: "AVAILABLE",
        },
      });

      if (updatedSeats.count !== input.seatIds.length) {
        throw new SeatUnavailableError(input.seatIds);
      }

      const totalCents = requirePositiveTotal(event.priceCents, input.seatIds.length);
      const reservation = await transaction.reservation.create({
        data: {
          customerId: input.customerId,
          eventId: input.eventId,
          subtotalCents: totalCents,
          totalCents,
        },
        select: { id: true },
      });
      const reservationItems = await transaction.reservationItem.createManyAndReturn({
        data: input.seatIds.map((eventSeatId) => ({
          eventSeatId,
          reservationId: reservation.id,
          unitPriceCents: event.priceCents!,
        })),
        select: { eventSeatId: true, id: true },
      });

      await transaction.payment.create({
        data: {
          amountCents: totalCents,
          customerId: input.customerId,
          eventId: input.eventId,
          provider: "SIMULATOR",
          reference: `SIM-APPROVED-${randomUUID()}`,
          reservationId: reservation.id,
          status: "APPROVED",
        },
      });

      const itemIdBySeatId = new Map(
        reservationItems.map((item) => [item.eventSeatId, item.id]),
      );
      const createdTickets = await transaction.ticket.createManyAndReturn({
        data: input.tickets.map((ticket) => ({
          customerId: input.customerId,
          eventId: input.eventId,
          eventSeatId: ticket.eventSeatId,
          manualCode: ticket.manualCode,
          reservationItemId: itemIdBySeatId.get(ticket.eventSeatId)!,
          validationTokenAuthTag: ticket.validationTokenAuthTag,
          validationTokenCiphertext: ticket.validationTokenCiphertext,
          validationTokenHash: ticket.validationTokenHash,
          validationTokenIv: ticket.validationTokenIv,
        })),
        select: { eventSeatId: true, id: true },
      });
      const ticketIdBySeatId = new Map(
        createdTickets.map((ticket) => [ticket.eventSeatId, ticket.id]),
      );

      return {
        paymentStatus: "APPROVED",
        reservationId: reservation.id,
        tickets: input.seatIds.map((seatId) => ({
          id: ticketIdBySeatId.get(seatId)!,
          seatLabel: lockedSeatById.get(seatId)!.label,
        })),
        totalCents,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: 5_000,
      timeout: 10_000,
    },
  );
}

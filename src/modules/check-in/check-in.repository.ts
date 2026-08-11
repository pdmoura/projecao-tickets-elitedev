import "server-only";

import { Prisma, type PrismaClient } from "@/generated/prisma/client";

const ticketForCheckInSelect = {
  customer: { select: { name: true } },
  event: {
    select: {
      id: true,
      movieSnapshot: { select: { title: true } },
    },
  },
  eventId: true,
  eventSeat: { select: { label: true } },
  id: true,
  usedAt: true,
} as const;

export function findTicketByManualCode(
  database: PrismaClient,
  manualCode: string,
) {
  return database.ticket.findUnique({
    select: ticketForCheckInSelect,
    where: { manualCode },
  });
}

export function findTicketByValidationTokenHash(
  database: PrismaClient,
  validationTokenHash: string,
) {
  return database.ticket.findUnique({
    select: ticketForCheckInSelect,
    where: { validationTokenHash },
  });
}

export async function isPublishedEvent(
  database: PrismaClient,
  eventId: string,
): Promise<boolean> {
  return Boolean(
    await database.event.findFirst({
      select: { id: true },
      where: { id: eventId, status: "PUBLISHED" },
    }),
  );
}

export function recordNonConsumingValidation(
  database: PrismaClient,
  input: {
    eventId: string;
    gateUserId: string;
    result: "INVALID" | "WRONG_EVENT";
    ticketId: string | null;
  },
) {
  return database.ticketValidation.create({
    data: input,
    select: { validatedAt: true },
  });
}

export async function consumeTicketAtomically(
  database: PrismaClient,
  input: { eventId: string; gateUserId: string; ticketId: string },
): Promise<
  | { result: "VALID"; validatedAt: Date }
  | { result: "ALREADY_USED"; usedAt: Date }
> {
  return database.$transaction(
    async (transaction) => {
      const attemptedAt = new Date();
      const consumed = await transaction.ticket.updateMany({
        data: { usedAt: attemptedAt },
        where: {
          eventId: input.eventId,
          id: input.ticketId,
          usedAt: null,
        },
      });

      if (consumed.count === 1) {
        await transaction.ticketValidation.create({
          data: {
            eventId: input.eventId,
            gateUserId: input.gateUserId,
            result: "VALID",
            ticketId: input.ticketId,
            validatedAt: attemptedAt,
          },
        });

        return { result: "VALID", validatedAt: attemptedAt };
      }

      const ticket = await transaction.ticket.findFirst({
        select: { usedAt: true },
        where: { eventId: input.eventId, id: input.ticketId },
      });

      if (!ticket?.usedAt) {
        throw new Error("Atomic ticket consumption reached an invalid state.");
      }

      await transaction.ticketValidation.create({
        data: {
          eventId: input.eventId,
          gateUserId: input.gateUserId,
          result: "ALREADY_USED",
          ticketId: input.ticketId,
          validatedAt: attemptedAt,
        },
      });

      return { result: "ALREADY_USED", usedAt: ticket.usedAt };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: 5_000,
      timeout: 10_000,
    },
  );
}

export type TicketForCheckIn = NonNullable<
  Awaited<ReturnType<typeof findTicketByManualCode>>
>;

import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";

type EventHistoryDatabase = Pick<
  PrismaClient,
  "payment" | "reservation" | "ticket" | "ticketValidation"
>;

export async function hasTransactionalHistory(
  database: EventHistoryDatabase,
  eventId: string,
): Promise<boolean> {
  const [reservation, payment, ticket, validation] = await Promise.all([
    database.reservation.findFirst({ select: { id: true }, where: { eventId } }),
    database.payment.findFirst({ select: { id: true }, where: { eventId } }),
    database.ticket.findFirst({ select: { id: true }, where: { eventId } }),
    database.ticketValidation.findFirst({ select: { id: true }, where: { eventId } }),
  ]);

  return Boolean(reservation || payment || ticket || validation);
}

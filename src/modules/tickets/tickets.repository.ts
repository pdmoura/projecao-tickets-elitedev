import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";

const ticketPresentationSelect = {
  createdAt: true,
  event: {
    select: {
      id: true,
      movieSnapshot: { select: { title: true } },
      roomName: true,
      startsAt: true,
      venueName: true,
    },
  },
  eventSeat: { select: { label: true } },
  id: true,
  usedAt: true,
} as const;

export function listCustomerTickets(database: PrismaClient, customerId: string) {
  return database.ticket.findMany({
    orderBy: { createdAt: "desc" },
    select: ticketPresentationSelect,
    where: { customerId },
  });
}

export function findCustomerTicket(
  database: PrismaClient,
  customerId: string,
  ticketId: string,
) {
  return database.ticket.findFirst({
    select: {
      ...ticketPresentationSelect,
      customer: { select: { name: true } },
      manualCode: true,
      reservationItem: { select: { unitPriceCents: true } },
      validationTokenAuthTag: true,
      validationTokenCiphertext: true,
      validationTokenIv: true,
    },
    where: { customerId, id: ticketId },
  });
}

export function rotateCustomerTicketShareToken(
  database: PrismaClient,
  customerId: string,
  ticketId: string,
  shareTokenHash: string,
) {
  return database.ticket.updateMany({
    data: { shareTokenHash },
    where: { customerId, id: ticketId },
  });
}

export function findSharedTicket(database: PrismaClient, shareTokenHash: string) {
  return database.ticket.findFirst({
    select: {
      ...ticketPresentationSelect,
      manualCode: true,
      reservationItem: { select: { unitPriceCents: true } },
      validationTokenAuthTag: true,
      validationTokenCiphertext: true,
      validationTokenIv: true,
    },
    where: { shareTokenHash },
  });
}

import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { db } from "@/lib/db";

import { decryptValidationToken, formatManualCode } from "./ticket-credentials";
import { renderTicketQr } from "./ticket-qr";
import { TicketNotFoundError } from "./tickets.errors";
import { findCustomerTicket, listCustomerTickets } from "./tickets.repository";
import type { TicketDetail, TicketSummary } from "./tickets.types";

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
      roomName: event.roomName,
      startsAt: event.startsAt.toISOString(),
      venueName: event.venueName,
    },
    id: record.id,
    seatLabel: record.eventSeat.label,
    status: record.usedAt ? "USED" : "AVAILABLE_FOR_ENTRY",
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
  };
}

const ticketService = createTicketService();

export const getTicket = ticketService.getTicket;
export const listTickets = ticketService.listTickets;

import "server-only";

import { db } from "@/lib/db";
import { getPublishedEvent } from "@/modules/events";

import { EventSeatMismatchError } from "./seats.errors";
import type { EventSeat } from "./seats.types";

function toEventSeat(seat: {
  id: string;
  label: string;
  rowLabel: string;
  seatNumber: number;
  status: "AVAILABLE" | "SOLD";
}): EventSeat {
  return seat;
}

export async function getEventSeats(eventId: string): Promise<EventSeat[]> {
  await getPublishedEvent(eventId);

  const seats = await db.eventSeat.findMany({
    orderBy: [{ rowLabel: "asc" }, { seatNumber: "asc" }],
    select: {
      id: true,
      label: true,
      rowLabel: true,
      seatNumber: true,
      status: true,
    },
    where: { eventId },
  });

  return seats.map(toEventSeat);
}

export async function getEventSeatsByIds(
  eventId: string,
  seatIds: readonly string[],
): Promise<EventSeat[]> {
  await getPublishedEvent(eventId);

  const uniqueSeatIds = [...new Set(seatIds)];

  if (uniqueSeatIds.length === 0) {
    return [];
  }

  const seats = await db.eventSeat.findMany({
    orderBy: [{ rowLabel: "asc" }, { seatNumber: "asc" }],
    select: {
      id: true,
      label: true,
      rowLabel: true,
      seatNumber: true,
      status: true,
    },
    where: {
      eventId,
      id: { in: uniqueSeatIds },
    },
  });

  if (seats.length !== uniqueSeatIds.length) {
    throw new EventSeatMismatchError();
  }

  return seats.map(toEventSeat);
}

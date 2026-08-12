import "server-only";

import { db } from "@/lib/db";

import { getGateAdmissionState, type GateAdmissionState } from "./event-temporal";
import { EventNotFoundError } from "./events.errors";
import type { PublishedEventDetail, PublishedEventSummary } from "./events.types";

const posterFallbackPath = "/placeholders/poster-unavailable.png";

function requirePublishedEventFields(event: {
  capacity: number | null;
  priceCents: number | null;
  roomName: string | null;
  startsAt: Date | null;
  venueName: string | null;
}): {
  capacity: number;
  priceCents: number;
  roomName: string;
  startsAt: Date;
  venueName: string;
} {
  if (
    event.capacity === null ||
    event.priceCents === null ||
    event.roomName === null ||
    event.startsAt === null ||
    event.venueName === null
  ) {
    throw new EventNotFoundError();
  }

  return {
    capacity: event.capacity,
    priceCents: event.priceCents,
    roomName: event.roomName,
    startsAt: event.startsAt,
    venueName: event.venueName,
  };
}

function toEventSummary(event: {
  capacity: number | null;
  id: string;
  movieSnapshot: { posterPath: string | null; title: string };
  priceCents: number | null;
  roomName: string | null;
  startsAt: Date | null;
  venueName: string | null;
}): PublishedEventSummary {
  const fields = requirePublishedEventFields(event);

  return {
    id: event.id,
    movie: {
      posterPath: event.movieSnapshot.posterPath ?? posterFallbackPath,
      title: event.movieSnapshot.title,
    },
    priceCents: fields.priceCents,
    roomName: fields.roomName,
    startsAt: fields.startsAt.toISOString(),
    venueName: fields.venueName,
  };
}

export async function listPublishedEvents(
  search?: string,
): Promise<PublishedEventSummary[]> {
  const normalizedSearch = search?.trim();
  const events = await db.event.findMany({
    orderBy: { startsAt: "asc" },
    select: {
      capacity: true,
      id: true,
      movieSnapshot: { select: { posterPath: true, title: true } },
      priceCents: true,
      roomName: true,
      startsAt: true,
      venueName: true,
    },
    where: {
      ...(normalizedSearch
        ? {
            movieSnapshot: {
              title: { contains: normalizedSearch, mode: "insensitive" },
            },
          }
        : {}),
      startsAt: { gt: new Date() },
      status: "PUBLISHED",
    },
  });

  return events.map(toEventSummary);
}

export async function getPublishedEvent(
  eventId: string,
): Promise<PublishedEventDetail> {
  const event = await db.event.findFirst({
    select: {
      capacity: true,
      id: true,
      movieSnapshot: {
        select: {
          overview: true,
          posterPath: true,
          releaseDate: true,
          title: true,
        },
      },
      priceCents: true,
      roomName: true,
      startsAt: true,
      venueName: true,
    },
    where: {
      id: eventId,
      startsAt: { gt: new Date() },
      status: "PUBLISHED",
    },
  });

  if (!event) {
    throw new EventNotFoundError();
  }

  const summary = toEventSummary(event);

  return {
    ...summary,
    capacity: requirePublishedEventFields(event).capacity,
    movie: {
      ...summary.movie,
      overview: event.movieSnapshot.overview,
      releaseDate: event.movieSnapshot.releaseDate?.toISOString() ?? null,
    },
  };
}

export async function getPublicEvent(eventId: string): Promise<PublishedEventDetail> {
  const event = await db.event.findFirst({
    select: {
      capacity: true,
      id: true,
      movieSnapshot: {
        select: {
          overview: true,
          posterPath: true,
          releaseDate: true,
          title: true,
        },
      },
      priceCents: true,
      roomName: true,
      startsAt: true,
      venueName: true,
    },
    where: { id: eventId, status: "PUBLISHED" },
  });

  if (!event) {
    throw new EventNotFoundError();
  }

  const summary = toEventSummary(event);

  return {
    ...summary,
    capacity: requirePublishedEventFields(event).capacity,
    movie: {
      ...summary.movie,
      overview: event.movieSnapshot.overview,
      releaseDate: event.movieSnapshot.releaseDate?.toISOString() ?? null,
    },
  };
}

export async function listGateEvents(): Promise<
  Array<PublishedEventSummary & { gateState: GateAdmissionState }>
> {
  const events = await db.event.findMany({
    orderBy: { startsAt: "asc" },
    select: {
      capacity: true,
      id: true,
      movieSnapshot: { select: { posterPath: true, title: true } },
      priceCents: true,
      roomName: true,
      startsAt: true,
      venueName: true,
    },
    where: { startsAt: { not: null }, status: "PUBLISHED" },
  });

  const withStates = events.map((event) => {
    const summary = toEventSummary(event);
    return {
      ...summary,
      gateState: getGateAdmissionState(new Date(summary.startsAt)),
    };
  });

  const order = { ACTIVE: 0, NOT_STARTED: 1, EXPIRED: 2 } as const;
  return withStates.sort((left, right) => order[left.gateState] - order[right.gateState]);
}

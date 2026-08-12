import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getMovieDetails, type CatalogMovieDetails } from "@/modules/catalog";

import {
  EventImmutableError,
  OrganizerEventOwnershipError,
  OrganizerEventValidationError,
} from "./organizer-events.errors";
import type {
  OrganizerEvent,
  OrganizerEventUpdateInput,
} from "./organizer-events.types";

const posterFallbackPath = "/placeholders/poster-unavailable.png";

type CatalogGateway = {
  getMovieDetails(movieId: number): Promise<CatalogMovieDetails>;
};

type EventRecord = {
  capacity: number | null;
  createdAt: Date;
  id: string;
  movieSnapshot: {
    overview: string | null;
    posterPath: string | null;
    releaseDate: Date | null;
    title: string;
  };
  organizerId: string;
  priceCents: number | null;
  publishedAt: Date | null;
  roomName: string | null;
  rows: number | null;
  seatsPerRow: number | null;
  startsAt: Date | null;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: Date;
  venueName: string | null;
};

const organizerEventSelect = {
  capacity: true,
  createdAt: true,
  id: true,
  movieSnapshot: {
    select: {
      overview: true,
      posterPath: true,
      releaseDate: true,
      title: true,
    },
  },
  organizerId: true,
  priceCents: true,
  publishedAt: true,
  roomName: true,
  rows: true,
  seatsPerRow: true,
  startsAt: true,
  status: true,
  updatedAt: true,
  venueName: true,
} as const;

function toOrganizerEvent(event: EventRecord): OrganizerEvent {
  return {
    capacity: event.capacity,
    createdAt: event.createdAt.toISOString(),
    id: event.id,
    movie: {
      overview: event.movieSnapshot.overview,
      posterPath: event.movieSnapshot.posterPath ?? posterFallbackPath,
      releaseDate: event.movieSnapshot.releaseDate?.toISOString() ?? null,
      title: event.movieSnapshot.title,
    },
    priceCents: event.priceCents,
    publishedAt: event.publishedAt?.toISOString() ?? null,
    roomName: event.roomName,
    rows: event.rows,
    seatsPerRow: event.seatsPerRow,
    startsAt: event.startsAt?.toISOString() ?? null,
    status: event.status,
    updatedAt: event.updatedAt.toISOString(),
    venueName: event.venueName,
  };
}

function assertOwnership(event: { organizerId: string }, organizerId: string): void {
  if (event.organizerId !== organizerId) {
    throw new OrganizerEventOwnershipError();
  }
}

function assertDraft(event: { status: "DRAFT" | "PUBLISHED" }): void {
  if (event.status !== "DRAFT") {
    throw new EventImmutableError();
  }
}

function parseReleaseDate(releaseDate: string | null): Date | null {
  if (!releaseDate) {
    return null;
  }

  const parsed = new Date(`${releaseDate}T00:00:00.000Z`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function getOrCreateMovieSnapshot(
  database: PrismaClient,
  catalog: CatalogGateway,
  movieExternalId: number,
): Promise<{ id: string }> {
  const existingSnapshot = await database.movieSnapshot.findUnique({
    select: { id: true },
    where: {
      source_externalId: {
        externalId: movieExternalId,
        source: "TMDB",
      },
    },
  });

  if (existingSnapshot) {
    return existingSnapshot;
  }

  const movie = await catalog.getMovieDetails(movieExternalId);

  return database.movieSnapshot.create({
    data: {
      backdropPath: movie.backdropUrl,
      externalId: movie.externalId,
      overview: movie.overview || null,
      posterPath: movie.posterUrl,
      releaseDate: parseReleaseDate(movie.releaseDate),
      source: "TMDB",
      title: movie.title,
    },
    select: { id: true },
  });
}

function createSeats(eventId: string, rows: number, seatsPerRow: number) {
  return Array.from({ length: rows }, (_, rowIndex) => {
    const rowLabel = String.fromCharCode("A".charCodeAt(0) + rowIndex);

    return Array.from({ length: seatsPerRow }, (_, seatIndex) => {
      const seatNumber = seatIndex + 1;

      return {
        eventId,
        label: `${rowLabel}${seatNumber}`,
        rowLabel,
        seatNumber,
        status: "AVAILABLE" as const,
      };
    });
  }).flat();
}

function assertPublishable(event: {
  priceCents: number | null;
  roomName: string | null;
  rows: number | null;
  seatsPerRow: number | null;
  startsAt: Date | null;
  venueName: string | null;
}): asserts event is {
  priceCents: number;
  roomName: string;
  rows: number;
  seatsPerRow: number;
  startsAt: Date;
  venueName: string;
} {
  if (
    event.priceCents === null ||
    event.roomName === null ||
    event.rows === null ||
    event.seatsPerRow === null ||
    event.startsAt === null ||
    event.venueName === null
  ) {
    throw new OrganizerEventValidationError(
      "Preencha filme, data, local, sala, preço e capacidade antes de publicar.",
    );
  }

  if (event.startsAt.getTime() <= Date.now()) {
    throw new OrganizerEventValidationError(
      "A sessão precisa estar agendada para uma data e horário futuros.",
    );
  }
}

export function createOrganizerEventsService(
  database: PrismaClient = db,
  catalog: CatalogGateway = { getMovieDetails },
) {
  return {
    async list(organizerId: string): Promise<OrganizerEvent[]> {
      const events = await database.event.findMany({
        orderBy: [{ status: "asc" }, { startsAt: "asc" }, { createdAt: "desc" }],
        select: organizerEventSelect,
        where: { organizerId },
      });

      return events.map(toOrganizerEvent);
    },

    async get(organizerId: string, eventId: string): Promise<OrganizerEvent> {
      const event = await database.event.findUnique({
        select: organizerEventSelect,
        where: { id: eventId },
      });

      if (!event) {
        throw new OrganizerEventOwnershipError();
      }

      assertOwnership(event, organizerId);

      return toOrganizerEvent(event);
    },

    async createDraft(organizerId: string, movieExternalId: number): Promise<OrganizerEvent> {
      const movieSnapshot = await getOrCreateMovieSnapshot(
        database,
        catalog,
        movieExternalId,
      );

      const event = await database.event.create({
        data: {
          movieSnapshotId: movieSnapshot.id,
          organizerId,
          status: "DRAFT",
        },
        select: organizerEventSelect,
      });

      return toOrganizerEvent(event);
    },

    async updateDraft(
      organizerId: string,
      eventId: string,
      input: OrganizerEventUpdateInput,
    ): Promise<OrganizerEvent> {
      const event = await database.event.findUnique({
        select: { organizerId: true, status: true },
        where: { id: eventId },
      });

      if (!event) {
        throw new OrganizerEventOwnershipError();
      }

      assertOwnership(event, organizerId);
      assertDraft(event);

      const updatedEvent = await database.event.update({
        data: {
          capacity: input.rows * input.seatsPerRow,
          priceCents: input.priceCents,
          roomName: input.roomName,
          rows: input.rows,
          seatsPerRow: input.seatsPerRow,
          startsAt: input.startsAt,
          venueName: input.venueName,
        },
        select: organizerEventSelect,
        where: { id: eventId },
      });

      return toOrganizerEvent(updatedEvent);
    },

    async changeDraftMovie(
      organizerId: string,
      eventId: string,
      movieExternalId: number,
    ): Promise<OrganizerEvent> {
      const event = await database.event.findUnique({
        select: { organizerId: true, status: true },
        where: { id: eventId },
      });

      if (!event) {
        throw new OrganizerEventOwnershipError();
      }

      assertOwnership(event, organizerId);
      assertDraft(event);

      const movieSnapshot = await getOrCreateMovieSnapshot(
        database,
        catalog,
        movieExternalId,
      );
      const updatedEvent = await database.event.update({
        data: { movieSnapshotId: movieSnapshot.id },
        select: organizerEventSelect,
        where: { id: eventId },
      });

      return toOrganizerEvent(updatedEvent);
    },

    async deleteDraft(organizerId: string, eventId: string): Promise<void> {
      await database.$transaction(async (transaction) => {
        const event = await transaction.event.findUnique({
          select: { organizerId: true, status: true },
          where: { id: eventId },
        });

        if (!event) {
          throw new OrganizerEventOwnershipError();
        }

        assertOwnership(event, organizerId);
        assertDraft(event);

        const [reservations, payments, tickets, validations] = await Promise.all([
          transaction.reservation.count({ where: { eventId } }),
          transaction.payment.count({ where: { eventId } }),
          transaction.ticket.count({ where: { eventId } }),
          transaction.ticketValidation.count({ where: { eventId } }),
        ]);

        if (reservations + payments + tickets + validations > 0) {
          throw new EventImmutableError();
        }

        await transaction.eventSeat.deleteMany({ where: { eventId } });
        await transaction.event.delete({ where: { id: eventId } });
      });
    },

    async publish(organizerId: string, eventId: string): Promise<OrganizerEvent> {
      return database.$transaction(async (transaction) => {
        const event = await transaction.event.findUnique({
          select: organizerEventSelect,
          where: { id: eventId },
        });

        if (!event) {
          throw new OrganizerEventOwnershipError();
        }

        assertOwnership(event, organizerId);
        assertDraft(event);
        assertPublishable(event);

        const publication = await transaction.event.updateMany({
          data: {
            publishedAt: new Date(),
            status: "PUBLISHED",
          },
          where: {
            id: eventId,
            organizerId,
            status: "DRAFT",
          },
        });

        if (publication.count !== 1) {
          throw new EventImmutableError();
        }

        await transaction.eventSeat.createMany({
          data: createSeats(eventId, event.rows, event.seatsPerRow),
        });

        const publishedEvent = await transaction.event.findUniqueOrThrow({
          select: organizerEventSelect,
          where: { id: eventId },
        });

        return toOrganizerEvent(publishedEvent);
      });
    },
  };
}

const organizerEventsService = createOrganizerEventsService();

export const listOrganizerEvents = organizerEventsService.list;
export const getOrganizerEvent = organizerEventsService.get;
export const createOrganizerDraft = organizerEventsService.createDraft;
export const updateOrganizerDraft = organizerEventsService.updateDraft;
export const changeOrganizerDraftMovie = organizerEventsService.changeDraftMovie;
export const deleteOrganizerDraft = organizerEventsService.deleteDraft;
export const publishOrganizerEvent = organizerEventsService.publish;

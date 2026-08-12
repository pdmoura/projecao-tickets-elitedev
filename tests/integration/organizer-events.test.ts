import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DELETE as deleteOrganizerEventRoute,
  PATCH as patchOrganizerEventRoute,
  PUT as putOrganizerEventRoute,
} from "@/app/api/organizer/events/[eventId]/route";
import { GET as getOrganizerEventsRoute } from "@/app/api/organizer/events/route";
import { db } from "@/lib/db";
import { authRouteHandlers } from "@/modules/auth/next-handler";
import {
  createOrganizerEventsService,
  EventHasTransactionHistoryError,
  OrganizerEventOwnershipError,
} from "@/modules/events";
import type { CatalogMovieDetails } from "@/modules/catalog/catalog.types";
import { getPublishedEvent, listPublishedEvents } from "@/modules/events";
import { demoPassword, seedDemoData } from "../../prisma/seed";

const organizerEventsUrl = "http://localhost:3000/api/organizer/events";

const catalogMovie: CatalogMovieDetails = {
  backdropUrl: null,
  externalId: 998877,
  genres: ["Drama"],
  overview: "Uma sessão criada para testar a curadoria do organizador.",
  posterUrl: "/placeholders/poster-unavailable.png",
  releaseDate: "2024-05-10",
  runtimeMinutes: 106,
  title: "Filme de Curadoria",
};

const replacementMovie: CatalogMovieDetails = {
  ...catalogMovie,
  externalId: 112233,
  posterUrl: "https://image.tmdb.org/t/p/w500/replacement.jpg",
  releaseDate: "2025-02-14",
  title: "Outro Filme de Curadoria",
};

async function cleanDatabase() {
  await db.$transaction([
    db.ticketValidation.deleteMany(),
    db.ticket.deleteMany(),
    db.payment.deleteMany(),
    db.reservationItem.deleteMany(),
    db.reservation.deleteMany(),
    db.eventSeat.deleteMany(),
    db.event.deleteMany(),
    db.movieSnapshot.deleteMany(),
    db.session.deleteMany(),
    db.account.deleteMany(),
    db.verification.deleteMany(),
    db.user.deleteMany(),
  ]);
}

async function signIn(email: string): Promise<string> {
  const response = await authRouteHandlers.POST(
    new Request("http://localhost:3000/api/auth/sign-in/email", {
      body: JSON.stringify({ email, password: demoPassword }),
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      method: "POST",
    }),
  );
  const cookie = response.headers.get("set-cookie")?.split(";")[0];

  if (!cookie) {
    throw new Error("Expected a session cookie.");
  }

  return cookie;
}

function validDraftInput() {
  return {
    priceCents: 3400,
    roomName: "Sala Curadoria",
    rows: 4,
    seatsPerRow: 6,
    startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    venueName: "Cine Projeção",
  };
}

describe("organizer event creation and publication", () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedDemoData(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("creates a local movie snapshot, keeps the draft private, and publishes generated seats", async () => {
    const organizer = await db.user.findUniqueOrThrow({
      where: { email: "organizador@projecao.local" },
    });
    const catalog = { getMovieDetails: vi.fn().mockResolvedValue(catalogMovie) };
    const service = createOrganizerEventsService(db, catalog);
    const draft = await service.createDraft(organizer.id, catalogMovie.externalId);

    expect(catalog.getMovieDetails).toHaveBeenCalledWith(catalogMovie.externalId);
    await expect(
      db.movieSnapshot.findUniqueOrThrow({
        where: {
          source_externalId: {
            externalId: catalogMovie.externalId,
            source: "TMDB",
          },
        },
      }),
    ).resolves.toMatchObject({
      overview: catalogMovie.overview,
      posterPath: catalogMovie.posterUrl,
      title: catalogMovie.title,
    });
    expect(draft.status).toBe("DRAFT");
    await expect(listPublishedEvents(catalogMovie.title)).resolves.toEqual([]);

    await service.updateDraft(organizer.id, draft.id, validDraftInput());
    const published = await service.publish(organizer.id, draft.id);

    expect(published).toMatchObject({
      capacity: 24,
      movie: { title: catalogMovie.title },
      status: "PUBLISHED",
    });
    await expect(
      db.eventSeat.count({ where: { eventId: draft.id, status: "AVAILABLE" } }),
    ).resolves.toBe(24);
    await expect(getPublishedEvent(draft.id)).resolves.toMatchObject({
      movie: {
        overview: catalogMovie.overview,
        title: catalogMovie.title,
      },
    });
    await expect(listPublishedEvents(catalogMovie.title)).resolves.toEqual([
      expect.objectContaining({
        id: draft.id,
        movie: expect.objectContaining({ title: catalogMovie.title }),
      }),
    ]);
  });

  it("allows edits to a published event without transaction history", async () => {
    const organizer = await db.user.findUniqueOrThrow({
      where: { email: "organizador@projecao.local" },
    });
    const service = createOrganizerEventsService(db, {
      getMovieDetails: vi.fn().mockResolvedValue(catalogMovie),
    });
    const draft = await service.createDraft(organizer.id, catalogMovie.externalId);

    await service.updateDraft(organizer.id, draft.id, validDraftInput());
    await service.publish(organizer.id, draft.id);

    await service.updateDraft(organizer.id, draft.id, {
      ...validDraftInput(),
      roomName: "Outra sala",
    });
    await expect(db.event.findUniqueOrThrow({ where: { id: draft.id } })).resolves.toMatchObject({
      roomName: "Outra sala",
      status: "PUBLISHED",
    });
  });

  it("lists only the authenticated organizer events and forbids cross-owner mutations", async () => {
    const organizer = await db.user.findUniqueOrThrow({
      where: { email: "organizador@projecao.local" },
    });
    const otherOrganizer = await db.user.create({
      data: {
        email: "outro-organizador@projecao.local",
        emailVerified: true,
        name: "Outro Organizador",
        role: "ORGANIZER",
      },
    });
    const service = createOrganizerEventsService(db, {
      getMovieDetails: vi.fn().mockResolvedValue(catalogMovie),
    });
    const foreignDraft = await service.createDraft(otherOrganizer.id, catalogMovie.externalId);
    const organizerCookie = await signIn(organizer.email);
    const customerCookie = await signIn("cliente1@projecao.local");

    const listResponse = await getOrganizerEventsRoute(
      new Request(organizerEventsUrl, { headers: { cookie: organizerCookie } }),
    );
    const events = (await listResponse.json()) as Array<{ id: string }>;
    const forbiddenRoleResponse = await getOrganizerEventsRoute(
      new Request(organizerEventsUrl, { headers: { cookie: customerCookie } }),
    );
    const forbiddenPatchResponse = await patchOrganizerEventRoute(
      new Request(`${organizerEventsUrl}/${foreignDraft.id}`, {
        body: JSON.stringify({
          ...validDraftInput(),
          startsAt: validDraftInput().startsAt.toISOString(),
        }),
        headers: {
          "content-type": "application/json",
          cookie: organizerCookie,
        },
        method: "PATCH",
      }),
      { params: Promise.resolve({ eventId: foreignDraft.id }) },
    );
    const forbiddenMovieChangeResponse = await putOrganizerEventRoute(
      new Request(`${organizerEventsUrl}/${foreignDraft.id}`, {
        body: JSON.stringify({ movieExternalId: replacementMovie.externalId }),
        headers: {
          "content-type": "application/json",
          cookie: organizerCookie,
        },
        method: "PUT",
      }),
      { params: Promise.resolve({ eventId: foreignDraft.id }) },
    );

    expect(listResponse.status).toBe(200);
    expect(events.some((event) => event.id === foreignDraft.id)).toBe(false);
    expect(forbiddenRoleResponse.status).toBe(403);
    expect(forbiddenPatchResponse.status).toBe(403);
    expect(forbiddenMovieChangeResponse.status).toBe(403);
    await expect(forbiddenPatchResponse.json()).resolves.toMatchObject({
      error: { code: "FORBIDDEN" },
    });
    await expect(
      service.updateDraft(organizer.id, foreignDraft.id, validDraftInput()),
    ).rejects.toBeInstanceOf(OrganizerEventOwnershipError);
  });

  it("changes only the movie snapshot of an owned draft and keeps its event id", async () => {
    const organizer = await db.user.findUniqueOrThrow({
      where: { email: "organizador@projecao.local" },
    });
    const catalog = {
      getMovieDetails: vi
        .fn()
        .mockResolvedValueOnce(catalogMovie)
        .mockResolvedValueOnce(replacementMovie),
    };
    const service = createOrganizerEventsService(db, catalog);
    const draft = await service.createDraft(organizer.id, catalogMovie.externalId);

    const changed = await service.changeDraftMovie(
      organizer.id,
      draft.id,
      replacementMovie.externalId,
    );

    expect(changed).toMatchObject({
      id: draft.id,
      movie: { posterPath: replacementMovie.posterUrl, title: replacementMovie.title },
    });
    const storedEvent = await db.event.findUniqueOrThrow({
      include: { movieSnapshot: true },
      where: { id: draft.id },
    });
    expect(storedEvent.movieSnapshot.externalId).toBe(replacementMovie.externalId);

    await service.changeDraftMovie(organizer.id, draft.id, replacementMovie.externalId);
    expect(catalog.getMovieDetails).toHaveBeenCalledTimes(2);
  });

  it("forbids foreign changes and locks a published event with history", async () => {
    const organizer = await db.user.findUniqueOrThrow({
      where: { email: "organizador@projecao.local" },
    });
    const otherOrganizer = await db.user.create({
      data: {
        email: "owner-for-delete@projecao.local",
        emailVerified: true,
        name: "Outro Organizador",
        role: "ORGANIZER",
      },
    });
    const service = createOrganizerEventsService(db, {
      getMovieDetails: vi.fn().mockResolvedValue(catalogMovie),
    });
    const foreignDraft = await service.createDraft(otherOrganizer.id, catalogMovie.externalId);
    const ownDraft = await service.createDraft(organizer.id, catalogMovie.externalId);

    await expect(
      service.changeDraftMovie(organizer.id, foreignDraft.id, replacementMovie.externalId),
    ).rejects.toBeInstanceOf(OrganizerEventOwnershipError);
    await expect(service.deleteDraft(organizer.id, foreignDraft.id)).rejects.toBeInstanceOf(
      OrganizerEventOwnershipError,
    );

    await service.updateDraft(organizer.id, ownDraft.id, validDraftInput());
    await service.publish(organizer.id, ownDraft.id);
    await db.payment.create({
      data: {
        amountCents: 3400,
        customerId: (await db.user.findUniqueOrThrow({ where: { email: "cliente1@projecao.local" } })).id,
        eventId: ownDraft.id,
        provider: "SIMULATOR",
        reference: `history-${ownDraft.id}-${Date.now()}`,
        status: "DECLINED",
      },
    });
    await expect(
      service.changeDraftMovie(organizer.id, ownDraft.id, replacementMovie.externalId),
    ).rejects.toBeInstanceOf(EventHasTransactionHistoryError);
    await expect(service.deleteDraft(organizer.id, ownDraft.id)).rejects.toBeInstanceOf(
      EventHasTransactionHistoryError,
    );
  });

  it("deletes owned sessions without transaction history through the route", async () => {
    const organizer = await db.user.findUniqueOrThrow({
      where: { email: "organizador@projecao.local" },
    });
    const service = createOrganizerEventsService(db, {
      getMovieDetails: vi.fn().mockResolvedValue(catalogMovie),
    });
    const draft = await service.createDraft(organizer.id, catalogMovie.externalId);
    const organizerCookie = await signIn(organizer.email);
    const response = await deleteOrganizerEventRoute(
      new Request(`${organizerEventsUrl}/${draft.id}`, {
        headers: { cookie: organizerCookie },
        method: "DELETE",
      }),
      { params: Promise.resolve({ eventId: draft.id }) },
    );

    expect(response.status).toBe(204);
    await expect(db.event.findUnique({ where: { id: draft.id } })).resolves.toBeNull();
    await expect(service.list(organizer.id)).resolves.not.toContainEqual(
      expect.objectContaining({ id: draft.id }),
    );

    const published = await service.createDraft(organizer.id, catalogMovie.externalId);
    await service.updateDraft(organizer.id, published.id, validDraftInput());
    await service.publish(organizer.id, published.id);
    const publishedResponse = await deleteOrganizerEventRoute(
      new Request(`${organizerEventsUrl}/${published.id}`, {
        headers: { cookie: organizerCookie },
        method: "DELETE",
      }),
      { params: Promise.resolve({ eventId: published.id }) },
    );
    expect(publishedResponse.status).toBe(204);
  });
});

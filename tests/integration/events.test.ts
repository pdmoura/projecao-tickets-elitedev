import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { GET as getEventRoute } from "@/app/api/events/[eventId]/route";
import { GET as getEventSeatsRoute } from "@/app/api/events/[eventId]/seats/route";
import { GET as getEventsRoute } from "@/app/api/events/route";
import { db } from "@/lib/db";
import {
  EventNotFoundError,
  getPublishedEvent,
  listPublishedEvents,
} from "@/modules/events";
import { EventSeatMismatchError, getEventSeats, getEventSeatsByIds } from "@/modules/seats";
import { seedDemoData } from "../../prisma/seed";

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

describe("published events and seats", () => {
  beforeAll(async () => {
    await cleanDatabase();
    await seedDemoData(db);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("seeds the local snapshots, events and deterministic seats idempotently", async () => {
    await seedDemoData(db);

    await expect(
      Promise.all([
        db.movieSnapshot.count(),
        db.event.count(),
        db.eventSeat.count(),
      ]),
    ).resolves.toEqual([4, 4, 73]);
  });

  it("exposes only future published events and searches their snapshot titles", async () => {
    const events = await listPublishedEvents();
    const searchResults = await listPublishedEvents("PARIS");

    expect(events.map((event) => event.id)).toEqual([
      "seed-event-spirited-away",
      "seed-event-paris-texas",
    ]);
    expect(searchResults.map((event) => event.movie.title)).toEqual(["Paris, Texas"]);
    await expect(getPublishedEvent("seed-event-draft")).rejects.toBeInstanceOf(
      EventNotFoundError,
    );
    await expect(getPublishedEvent("seed-event-archive")).rejects.toBeInstanceOf(
      EventNotFoundError,
    );
  });

  it("returns event detail exclusively from the persisted snapshot", async () => {
    const fetchMock = vi.fn(() => {
      throw new Error("TMDb must not be called for an existing event.");
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(getPublishedEvent("seed-event-spirited-away")).resolves.toMatchObject({
      movie: {
        overview: expect.stringContaining("espíritos"),
        posterPath: "/placeholders/poster-unavailable.png",
        title: "A Viagem de Chihiro",
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns seats for the requested event and rejects a seat from another event", async () => {
    const firstEventSeats = await getEventSeats("seed-event-spirited-away");
    const secondEventSeats = await getEventSeats("seed-event-paris-texas");
    const foreignSeat = secondEventSeats[0];

    expect(firstEventSeats).toHaveLength(24);
    expect(firstEventSeats.find((seat) => seat.label === "C3")?.status).toBe("SOLD");
    expect(firstEventSeats.find((seat) => seat.label === "A1")?.status).toBe(
      "AVAILABLE",
    );
    expect(foreignSeat).toBeDefined();
    await expect(
      getEventSeatsByIds("seed-event-spirited-away", [foreignSeat!.id]),
    ).rejects.toBeInstanceOf(EventSeatMismatchError);
  });

  it("serves public event and seat contracts", async () => {
    const listResponse = await getEventsRoute(
      new Request("http://localhost:3000/api/events?search=chihiro"),
    );
    const detailResponse = await getEventRoute(
      new Request("http://localhost:3000/api/events/seed-event-spirited-away"),
      { params: Promise.resolve({ eventId: "seed-event-spirited-away" }) },
    );
    const seatsResponse = await getEventSeatsRoute(
      new Request("http://localhost:3000/api/events/seed-event-spirited-away/seats"),
      { params: Promise.resolve({ eventId: "seed-event-spirited-away" }) },
    );

    expect(listResponse.status).toBe(200);
    await expect(listResponse.json()).resolves.toHaveLength(1);
    expect(detailResponse.status).toBe(200);
    await expect(detailResponse.json()).resolves.toMatchObject({
      movie: { title: "A Viagem de Chihiro" },
    });
    expect(seatsResponse.status).toBe(200);
    await expect(seatsResponse.json()).resolves.toMatchObject({
      eventId: "seed-event-spirited-away",
      seats: expect.any(Array),
    });
  });
});

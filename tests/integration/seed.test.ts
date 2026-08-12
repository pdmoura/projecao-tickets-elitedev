import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";
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

describe("offline demo seed", () => {
  beforeEach(cleanDatabase);

  afterAll(async () => {
    await db.$disconnect();
  });

  it("uses curated TMDb snapshots with real IDs and non-placeholder posters", async () => {
    await seedDemoData(db);
    const snapshots = await db.movieSnapshot.findMany({
      orderBy: { externalId: "asc" },
      select: { backdropPath: true, externalId: true, posterPath: true, releaseDate: true, title: true },
    });

    expect(snapshots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ externalId: 129, title: "Spirited Away" }),
        expect.objectContaining({ externalId: 655, title: "Paris, Texas" }),
        expect.objectContaining({ externalId: 25376, title: "El secreto de sus ojos" }),
        expect.objectContaining({ externalId: 194662, title: "Birdman" }),
        expect.objectContaining({ externalId: 496243, title: "Parasite" }),
        expect.objectContaining({ externalId: 372058, title: "Your Name." }),
        expect.objectContaining({ externalId: 313369, title: "La La Land" }),
        expect.objectContaining({ externalId: 12477, title: "Grave of the Fireflies" }),
        expect.objectContaining({ externalId: 13, title: "Forrest Gump" }),
      ]),
    );
    expect(snapshots.every((snapshot) => snapshot.posterPath?.startsWith("https://image.tmdb.org/t/p/"))).toBe(true);
    expect(snapshots.every((snapshot) => snapshot.backdropPath === null || snapshot.backdropPath.startsWith("https://image.tmdb.org/t/p/"))).toBe(true);
    expect(snapshots.every((snapshot) => snapshot.releaseDate !== null)).toBe(true);
  });

  it("is idempotent and never calls the network", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await seedDemoData(db);
    await seedDemoData(db);

    expect(fetchSpy).not.toHaveBeenCalled();
    await expect(db.user.count()).resolves.toBe(4);
    await expect(db.movieSnapshot.count()).resolves.toBe(9);
    await expect(db.event.count()).resolves.toBe(9);
    await expect(db.eventSeat.count({ where: { eventId: "seed-event-spirited-away" } })).resolves.toBe(24);
    fetchSpy.mockRestore();
  });
});

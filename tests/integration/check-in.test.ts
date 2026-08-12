import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { POST as manualCheckInRoute } from "@/app/api/check-in/manual/route";
import { POST as qrCheckInRoute } from "@/app/api/check-in/qr/route";
import { POST as checkoutRoute } from "@/app/api/checkout/route";
import { createPrismaClient } from "@/lib/db/client";
import { db } from "@/lib/db";
import { authRouteHandlers } from "@/modules/auth/next-handler";
import { createCheckInService } from "@/modules/check-in/check-in.service";
import { decryptValidationToken } from "@/modules/tickets/ticket-credentials";
import { demoPassword, seedDemoData } from "../../prisma/seed";

const manualCheckInUrl = "http://localhost:3000/api/check-in/manual";
const qrCheckInUrl = "http://localhost:3000/api/check-in/qr";

function getTestDatabaseUrl(): string {
  const value = process.env.TEST_DATABASE_URL?.trim();

  if (!value) {
    throw new Error("TEST_DATABASE_URL is required for check-in integration tests.");
  }

  return value;
}

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

async function buyTicket(
  customerCookie: string,
  eventId = "seed-event-spirited-away",
  seatLabel = "A1",
) {
  const seat = await db.eventSeat.findFirstOrThrow({
    where: { eventId, label: seatLabel },
  });
  const response = await checkoutRoute(
    new Request("http://localhost:3000/api/checkout", {
      body: JSON.stringify({
        eventId,
        payment: {
          cardNumber: "4242 4242 4242 4242",
          cvv: "123",
          expiry: "12/30",
          method: "SIMULATED_CARD",
        },
        seatIds: [seat.id],
      }),
      headers: { "content-type": "application/json", cookie: customerCookie },
      method: "POST",
    }),
  );
  const payload = (await response.json()) as {
    tickets: Array<{ id: string }>;
  };

  expect(response.status).toBe(201);
  await db.event.update({
    data: { startsAt: new Date(Date.now() - 60_000) },
    where: { id: eventId },
  });
  return db.ticket.findUniqueOrThrow({ where: { id: payload.tickets[0]!.id } });
}

function postManual(cookie: string | undefined, body: unknown) {
  return manualCheckInRoute(
    new Request(manualCheckInUrl, {
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      method: "POST",
    }),
  );
}

function postQr(cookie: string | undefined, body: unknown) {
  return qrCheckInRoute(
    new Request(qrCheckInUrl, {
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      method: "POST",
    }),
  );
}

describe("atomic gate check-in", () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedDemoData(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("allows only GATE users on both credential endpoints", async () => {
    const customerCookie = await signIn("cliente1@projecao.local");
    const organizerCookie = await signIn("organizador@projecao.local");
    const manualBody = {
      code: "ABCD-EFGH-JKMP",
      eventId: "seed-event-spirited-away",
    };
    const qrBody = {
      eventId: "seed-event-spirited-away",
      token: Buffer.alloc(32, 4).toString("base64url"),
    };

    expect((await postManual(undefined, manualBody)).status).toBe(401);
    expect((await postManual(customerCookie, manualBody)).status).toBe(403);
    expect((await postQr(organizerCookie, qrBody)).status).toBe(403);
    await expect(db.ticketValidation.count()).resolves.toBe(0);
  });

  it("returns VALID for QR once and ALREADY_USED thereafter", async () => {
    const customerCookie = await signIn("cliente1@projecao.local");
    const gateCookie = await signIn("portaria@projecao.local");
    const ticket = await buyTicket(customerCookie);
    const validationToken = decryptValidationToken(ticket);
    const body = { eventId: ticket.eventId, token: validationToken };
    const firstResponse = await postQr(gateCookie, body);
    const firstResult = (await firstResponse.json()) as {
      result: string;
      validatedAt: string;
    };
    const usedAfterFirstRead = (
      await db.ticket.findUniqueOrThrow({ where: { id: ticket.id } })
    ).usedAt;
    const secondResponse = await postQr(gateCookie, body);
    const secondResult = (await secondResponse.json()) as {
      result: string;
      usedAt: string;
    };
    const usedAfterSecondRead = (
      await db.ticket.findUniqueOrThrow({ where: { id: ticket.id } })
    ).usedAt;

    expect(firstResponse.status).toBe(200);
    expect(firstResult.result).toBe("VALID");
    expect(secondResponse.status).toBe(200);
    expect(secondResult.result).toBe("ALREADY_USED");
    expect(usedAfterFirstRead?.toISOString()).toBe(firstResult.validatedAt);
    expect(usedAfterSecondRead).toEqual(usedAfterFirstRead);
    expect(secondResult.usedAt).toBe(firstResult.validatedAt);
    const validations = await db.ticketValidation.findMany({
      select: { result: true, ticketId: true },
    });
    expect(validations.map((validation) => validation.result).sort()).toEqual([
      "ALREADY_USED",
      "VALID",
    ]);
    expect(validations.every((validation) => validation.ticketId === ticket.id)).toBe(
      true,
    );
    const serialized = JSON.stringify([firstResult, secondResult]);
    expect(serialized).not.toContain(validationToken);
    expect(serialized).not.toContain(ticket.validationTokenHash);
    expect(serialized).not.toContain("validationTokenCiphertext");
  });

  it("normalizes a manual code and consumes the matching ticket", async () => {
    const customerCookie = await signIn("cliente1@projecao.local");
    const gateCookie = await signIn("portaria@projecao.local");
    const ticket = await buyTicket(customerCookie);
    const formattedCode = ticket.manualCode.toLowerCase().match(/.{4}/g)!.join("-");
    const response = await postManual(gateCookie, {
      code: ` ${formattedCode} `,
      eventId: ticket.eventId,
    });
    const result = (await response.json()) as { result: string };

    expect(response.status).toBe(200);
    expect(result.result).toBe("VALID");
    await expect(
      db.ticket.findUniqueOrThrow({ where: { id: ticket.id } }),
    ).resolves.toMatchObject({ usedAt: expect.any(Date) });
    await expect(db.ticketValidation.findFirstOrThrow()).resolves.toMatchObject({
      result: "VALID",
      ticketId: ticket.id,
    });
  });

  it("audits unknown token and code as INVALID without a ticket", async () => {
    const gateCookie = await signIn("portaria@projecao.local");
    const eventId = "seed-event-spirited-away";
    await db.event.update({
      data: { startsAt: new Date(Date.now() - 60_000) },
      where: { id: eventId },
    });
    const qrResponse = await postQr(gateCookie, {
      eventId,
      token: Buffer.alloc(32, 19).toString("base64url"),
    });
    const manualResponse = await postManual(gateCookie, {
      code: "ZZZZ-ZZZZ-ZZZZ",
      eventId,
    });

    await expect(qrResponse.json()).resolves.toEqual({ result: "INVALID" });
    await expect(manualResponse.json()).resolves.toEqual({ result: "INVALID" });
    await expect(
      db.ticketValidation.findMany({
        orderBy: { validatedAt: "asc" },
        select: { eventId: true, result: true, ticketId: true },
      }),
    ).resolves.toEqual([
      { eventId, result: "INVALID", ticketId: null },
      { eventId, result: "INVALID", ticketId: null },
    ]);
    await expect(db.ticket.count({ where: { usedAt: { not: null } } })).resolves.toBe(0);
  });

  it("rejects a session that is not published before auditing", async () => {
    const gateCookie = await signIn("portaria@projecao.local");
    const response = await postManual(gateCookie, {
      code: "ZZZZ-ZZZZ-ZZZZ",
      eventId: "seed-event-draft",
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "EVENT_NOT_FOUND" },
    });
    await expect(db.ticketValidation.count()).resolves.toBe(0);
  });

  it("rejects gate validation before the start and after the local-day admission window", async () => {
    const gateCookie = await signIn("portaria@projecao.local");
    const eventId = "seed-event-spirited-away";

    const notStarted = await postManual(gateCookie, { code: "ZZZZ-ZZZZ-ZZZZ", eventId });
    expect(notStarted.status).toBe(409);
    await expect(notStarted.json()).resolves.toMatchObject({ error: { code: "EVENT_NOT_STARTED" } });

    await db.event.update({
      data: { startsAt: new Date("2026-08-10T23:00:00.000Z") },
      where: { id: eventId },
    });
    const expired = await postManual(gateCookie, { code: "ZZZZ-ZZZZ-ZZZZ", eventId });
    expect(expired.status).toBe(409);
    await expect(expired.json()).resolves.toMatchObject({ error: { code: "EVENT_EXPIRED" } });
    await expect(db.ticketValidation.count()).resolves.toBe(0);
  });

  it("returns and audits WRONG_EVENT without consuming the ticket", async () => {
    const customerCookie = await signIn("cliente1@projecao.local");
    const gateCookie = await signIn("portaria@projecao.local");
    const ticket = await buyTicket(customerCookie);
    await db.event.update({
      data: { startsAt: new Date(Date.now() - 60_000) },
      where: { id: "seed-event-paris-texas" },
    });
    const response = await postManual(gateCookie, {
      code: ticket.manualCode,
      eventId: "seed-event-paris-texas",
    });
    const result = (await response.json()) as { result: string };

    expect(response.status).toBe(200);
    expect(result.result).toBe("WRONG_EVENT");
    await expect(
      db.ticket.findUniqueOrThrow({ where: { id: ticket.id } }),
    ).resolves.toMatchObject({ usedAt: null });
    await expect(db.ticketValidation.findFirstOrThrow()).resolves.toMatchObject({
      eventId: "seed-event-paris-texas",
      result: "WRONG_EVENT",
      ticketId: ticket.id,
    });
  });

  it("returns exactly one VALID and one ALREADY_USED under real concurrency", async () => {
    const customerCookie = await signIn("cliente1@projecao.local");
    const ticket = await buyTicket(customerCookie);
    const gateUser = await db.user.findUniqueOrThrow({
      where: { email: "portaria@projecao.local" },
    });
    const firstDatabase = createPrismaClient(getTestDatabaseUrl());
    const secondDatabase = createPrismaClient(getTestDatabaseUrl());
    const firstCheckIn = createCheckInService(firstDatabase);
    const secondCheckIn = createCheckInService(secondDatabase);
    let release!: () => void;
    const startGate = new Promise<void>((resolve) => {
      release = resolve;
    });

    try {
      const firstAttempt = startGate.then(() =>
        firstCheckIn.checkInByManualCode(gateUser.id, {
          code: ticket.manualCode,
          eventId: ticket.eventId,
        }),
      );
      const secondAttempt = startGate.then(() =>
        secondCheckIn.checkInByManualCode(gateUser.id, {
          code: ticket.manualCode,
          eventId: ticket.eventId,
        }),
      );

      release();

      const results = await Promise.all([firstAttempt, secondAttempt]);
      expect(results.map((result) => result.result).sort()).toEqual([
        "ALREADY_USED",
        "VALID",
      ]);

      const persistedTicket = await db.ticket.findUniqueOrThrow({
        where: { id: ticket.id },
      });
      const validations = await db.ticketValidation.findMany({
        orderBy: { validatedAt: "asc" },
        where: { ticketId: ticket.id },
      });
      const validAudit = validations.find((item) => item.result === "VALID");

      expect(persistedTicket.usedAt).not.toBeNull();
      expect(validations.map((item) => item.result).sort()).toEqual([
        "ALREADY_USED",
        "VALID",
      ]);
      expect(validAudit?.validatedAt).toEqual(persistedTicket.usedAt);
    } finally {
      await Promise.all([
        firstDatabase.$disconnect(),
        secondDatabase.$disconnect(),
      ]);
    }
  });
});

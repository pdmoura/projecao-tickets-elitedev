import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { POST as checkoutRoute } from "@/app/api/checkout/route";
import { createPrismaClient } from "@/lib/db/client";
import { db } from "@/lib/db";
import { SeatUnavailableError } from "@/modules/checkout/checkout.errors";
import { createCheckoutService } from "@/modules/checkout/checkout.service";
import type { CheckoutInput } from "@/modules/checkout/checkout.types";
import { authRouteHandlers } from "@/modules/auth/next-handler";
import { demoPassword, seedDemoData } from "../../prisma/seed";

const checkoutUrl = "http://localhost:3000/api/checkout";

function getTestDatabaseUrl(): string {
  const value = process.env.TEST_DATABASE_URL?.trim();

  if (!value) {
    throw new Error("TEST_DATABASE_URL is required for checkout integration tests.");
  }

  return value;
}

function approvedCheckoutInput(eventId: string, seatIds: string[]): CheckoutInput {
  return {
    eventId,
    payment: {
      cardNumber: "4242 4242 4242 4242",
      cvv: "123",
      expiry: "12/30",
      method: "SIMULATED_CARD",
    },
    seatIds,
  };
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

async function postCheckout(cookie: string | undefined, body: unknown) {
  return checkoutRoute(
    new Request(checkoutUrl, {
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      method: "POST",
    }),
  );
}

async function getSeat(eventId: string, label: string) {
  return db.eventSeat.findFirstOrThrow({ where: { eventId, label } });
}

describe("transactional checkout", () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedDemoData(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("requires an authenticated CUSTOMER", async () => {
    const seat = await getSeat("seed-event-spirited-away", "A1");
    const organizerCookie = await signIn("organizador@projecao.local");

    expect((await postCheckout(undefined, approvedCheckoutInput(seat.eventId, [seat.id]))).status).toBe(401);
    expect(
      (await postCheckout(organizerCookie, approvedCheckoutInput(seat.eventId, [seat.id]))).status,
    ).toBe(403);
  });

  it("approves atomically and calculates the authoritative total", async () => {
    const seat = await getSeat("seed-event-spirited-away", "A1");
    const customerCookie = await signIn("cliente1@projecao.local");
    const response = await postCheckout(customerCookie, {
      ...approvedCheckoutInput(seat.eventId, [seat.id]),
      totalCents: 1,
    });
    const body = (await response.json()) as {
      paymentStatus: string;
      reservationId: string;
      tickets: unknown[];
      totalCents: number;
    };

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      paymentStatus: "APPROVED",
      tickets: [expect.any(Object)],
      totalCents: 3200,
    });
    await expect(
      db.reservation.findUniqueOrThrow({ where: { id: body.reservationId } }),
    ).resolves.toMatchObject({ subtotalCents: 3200, totalCents: 3200 });
    await expect(db.reservationItem.count()).resolves.toBe(1);
    await expect(db.ticket.count()).resolves.toBe(1);
    await expect(db.payment.findFirstOrThrow()).resolves.toMatchObject({
      amountCents: 3200,
      reservationId: body.reservationId,
      status: "APPROVED",
    });
    await expect(db.eventSeat.findUniqueOrThrow({ where: { id: seat.id } })).resolves.toMatchObject({
      status: "SOLD",
    });
  });

  it("persists a declined payment without creating or changing purchase records", async () => {
    const seat = await getSeat("seed-event-spirited-away", "A1");
    const customerCookie = await signIn("cliente1@projecao.local");
    const input = approvedCheckoutInput(seat.eventId, [seat.id]);
    input.payment.cardNumber = "4000 0000 0000 0002";
    const response = await postCheckout(customerCookie, input);

    expect(response.status).toBe(402);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "PAYMENT_DECLINED",
        message: "O pagamento simulado foi recusado.",
      },
    });
    await expect(db.payment.findFirstOrThrow()).resolves.toMatchObject({
      amountCents: 3200,
      reservationId: null,
      status: "DECLINED",
    });
    await expect(db.reservation.count()).resolves.toBe(0);
    await expect(db.reservationItem.count()).resolves.toBe(0);
    await expect(db.ticket.count()).resolves.toBe(0);
    await expect(db.eventSeat.findUniqueOrThrow({ where: { id: seat.id } })).resolves.toMatchObject({
      status: "AVAILABLE",
    });
  });

  it("rejects duplicates, foreign seats and unpublished events", async () => {
    const firstSeat = await getSeat("seed-event-spirited-away", "A1");
    const foreignSeat = await getSeat("seed-event-paris-texas", "A1");
    const draftSeat = await getSeat("seed-event-draft", "A1");
    const customerCookie = await signIn("cliente1@projecao.local");

    const duplicate = await postCheckout(
      customerCookie,
      approvedCheckoutInput(firstSeat.eventId, [firstSeat.id, firstSeat.id]),
    );
    const foreign = await postCheckout(
      customerCookie,
      approvedCheckoutInput(firstSeat.eventId, [firstSeat.id, foreignSeat.id]),
    );
    const draft = await postCheckout(
      customerCookie,
      approvedCheckoutInput(draftSeat.eventId, [draftSeat.id]),
    );

    expect(duplicate.status).toBe(400);
    await expect(duplicate.json()).resolves.toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
    expect(foreign.status).toBe(409);
    await expect(foreign.json()).resolves.toMatchObject({
      error: { code: "SEAT_UNAVAILABLE" },
    });
    expect(draft.status).toBe(404);
    await expect(draft.json()).resolves.toMatchObject({
      error: { code: "EVENT_NOT_FOUND" },
    });
    await expect(db.reservation.count()).resolves.toBe(0);
    await expect(db.ticket.count()).resolves.toBe(0);
  });

  it("rolls back the full multi-seat purchase when one seat conflicts", async () => {
    const availableSeat = await getSeat("seed-event-spirited-away", "A1");
    const soldSeat = await getSeat("seed-event-spirited-away", "C3");
    const customerCookie = await signIn("cliente1@projecao.local");
    const response = await postCheckout(
      customerCookie,
      approvedCheckoutInput(availableSeat.eventId, [availableSeat.id, soldSeat.id]),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "SEAT_UNAVAILABLE" },
    });
    await expect(db.reservation.count()).resolves.toBe(0);
    await expect(db.reservationItem.count()).resolves.toBe(0);
    await expect(db.payment.count()).resolves.toBe(0);
    await expect(db.ticket.count()).resolves.toBe(0);
    await expect(
      db.eventSeat.findUniqueOrThrow({ where: { id: availableSeat.id } }),
    ).resolves.toMatchObject({ status: "AVAILABLE" });
  });

  it("allows exactly one of two concurrent buyers to acquire the same seat", async () => {
    const seat = await getSeat("seed-event-spirited-away", "A1");
    const customers = await db.user.findMany({
      orderBy: { email: "asc" },
      where: { role: "CUSTOMER" },
    });
    const firstCustomer = customers[0];
    const secondCustomer = customers[1];

    if (!firstCustomer || !secondCustomer) {
      throw new Error("Expected two seeded customers.");
    }

    const firstDatabase = createPrismaClient(getTestDatabaseUrl());
    const secondDatabase = createPrismaClient(getTestDatabaseUrl());
    const firstCheckout = createCheckoutService(firstDatabase);
    const secondCheckout = createCheckoutService(secondDatabase);
    const input = approvedCheckoutInput(seat.eventId, [seat.id]);
    let startBoth!: () => void;
    const startGate = new Promise<void>((resolve) => {
      startBoth = resolve;
    });

    try {
      const firstAttempt = startGate.then(() =>
        firstCheckout.checkout(firstCustomer.id, input),
      );
      const secondAttempt = startGate.then(() =>
        secondCheckout.checkout(secondCustomer.id, input),
      );

      startBoth();

      const results = await Promise.allSettled([firstAttempt, secondAttempt]);
      const successes = results.filter((result) => result.status === "fulfilled");
      const conflicts = results.filter(
        (result) =>
          result.status === "rejected" && result.reason instanceof SeatUnavailableError,
      );

      expect(successes).toHaveLength(1);
      expect(conflicts).toHaveLength(1);
      await expect(
        db.reservation.count({ where: { eventId: seat.eventId } }),
      ).resolves.toBe(1);
      await expect(
        db.reservationItem.count({ where: { eventSeatId: seat.id } }),
      ).resolves.toBe(1);
      await expect(db.ticket.count({ where: { eventSeatId: seat.id } })).resolves.toBe(1);
      await expect(db.eventSeat.findUniqueOrThrow({ where: { id: seat.id } })).resolves.toMatchObject({
        status: "SOLD",
      });
    } finally {
      await Promise.all([firstDatabase.$disconnect(), secondDatabase.$disconnect()]);
    }
  });
});

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { GET as ticketDetailRoute } from "@/app/api/tickets/[ticketId]/route";
import { GET as ticketsRoute } from "@/app/api/tickets/route";
import { POST as checkoutRoute } from "@/app/api/checkout/route";
import { db } from "@/lib/db";
import { authRouteHandlers } from "@/modules/auth/next-handler";
import { decryptValidationToken } from "@/modules/tickets/ticket-credentials";
import { demoPassword, seedDemoData } from "../../prisma/seed";

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

async function buySeats(cookie: string, labels: string[]) {
  const seats = await db.eventSeat.findMany({
    orderBy: { label: "asc" },
    where: {
      eventId: "seed-event-spirited-away",
      label: { in: labels },
    },
  });
  const response = await checkoutRoute(
    new Request("http://localhost:3000/api/checkout", {
      body: JSON.stringify({
        eventId: "seed-event-spirited-away",
        payment: {
          cardNumber: "4242 4242 4242 4242",
          cvv: "123",
          expiry: "12/30",
          method: "SIMULATED_CARD",
        },
        seatIds: seats.map((seat) => seat.id),
      }),
      headers: { "content-type": "application/json", cookie },
      method: "POST",
    }),
  );

  expect(response.status).toBe(201);
  return (await response.json()) as {
    tickets: Array<{ id: string; seatLabel: string }>;
  };
}

function getTickets(cookie?: string) {
  return ticketsRoute(
    new Request("http://localhost:3000/api/tickets", {
      ...(cookie ? { headers: { cookie } } : {}),
    }),
  );
}

function getTicket(ticketId: string, cookie: string) {
  return ticketDetailRoute(
    new Request(`http://localhost:3000/api/tickets/${ticketId}`, {
      headers: { cookie },
    }),
    { params: Promise.resolve({ ticketId }) },
  );
}

describe("customer tickets", () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedDemoData(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("creates exactly one distinct ticket per reservation item", async () => {
    const customerCookie = await signIn("cliente1@projecao.local");

    await buySeats(customerCookie, ["A1", "A2"]);

    const tickets = await db.ticket.findMany({ orderBy: { id: "asc" } });
    const reservationItems = await db.reservationItem.findMany();

    expect(tickets).toHaveLength(2);
    expect(reservationItems).toHaveLength(2);
    expect(new Set(tickets.map((ticket) => ticket.reservationItemId)).size).toBe(2);
    expect(new Set(tickets.map((ticket) => ticket.validationTokenHash)).size).toBe(2);
    expect(
      tickets.every(
        (ticket) =>
          !ticket.validationTokenCiphertext.includes(
            decryptValidationToken(ticket),
          ),
      ),
    ).toBe(true);
  });

  it("lists only the authenticated customer's tickets", async () => {
    const firstCookie = await signIn("cliente1@projecao.local");
    const secondCookie = await signIn("cliente2@projecao.local");
    const organizerCookie = await signIn("organizador@projecao.local");

    await buySeats(firstCookie, ["A1", "A2"]);
    await buySeats(secondCookie, ["B1"]);

    const firstResponse = await getTickets(firstCookie);
    const secondResponse = await getTickets(secondCookie);
    const firstBody = (await firstResponse.json()) as { items: unknown[] };
    const secondBody = (await secondResponse.json()) as { items: unknown[] };

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(firstBody.items).toHaveLength(2);
    expect(secondBody.items).toHaveLength(1);
    expect((await getTickets()).status).toBe(401);
    expect((await getTickets(organizerCookie)).status).toBe(403);
  });

  it("reopens the same QR without exposing cryptographic storage fields", async () => {
    const customerCookie = await signIn("cliente1@projecao.local");
    const purchase = await buySeats(customerCookie, ["A1"]);
    const ticketId = purchase.tickets[0]!.id;
    const firstResponse = await getTicket(ticketId, customerCookie);
    const secondResponse = await getTicket(ticketId, customerCookie);
    const firstBody = (await firstResponse.json()) as Record<string, unknown>;
    const secondBody = (await secondResponse.json()) as Record<string, unknown>;
    const serialized = JSON.stringify(firstBody);

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(firstBody.qrDataUrl).toBe(secondBody.qrDataUrl);
    expect(firstBody.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(firstBody.manualCode).toMatch(
      /^[0-9A-HJKMNP-TV-Z]{4}(?:-[0-9A-HJKMNP-TV-Z]{4}){2}$/,
    );
    expect(serialized).not.toContain("validationTokenHash");
    expect(serialized).not.toContain("validationTokenCiphertext");
    expect(serialized).not.toContain("validationTokenIv");
    expect(serialized).not.toContain("validationTokenAuthTag");
  });

  it("returns the same 404 for another customer's ticket and an unknown id", async () => {
    const ownerCookie = await signIn("cliente1@projecao.local");
    const otherCookie = await signIn("cliente2@projecao.local");
    const purchase = await buySeats(ownerCookie, ["A1"]);
    const ticketId = purchase.tickets[0]!.id;
    const foreignResponse = await getTicket(ticketId, otherCookie);
    const missingResponse = await getTicket("ticket-inexistente", otherCookie);

    expect(foreignResponse.status).toBe(404);
    expect(missingResponse.status).toBe(404);
    expect(await foreignResponse.json()).toEqual(await missingResponse.json());
  });
});

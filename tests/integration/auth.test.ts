import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import {
  AuthenticationError,
  AuthorizationError,
  getSession,
  requireOwner,
  requireRole,
  requireUser,
} from "@/modules/auth";
import { authRouteHandlers } from "@/modules/auth/next-handler";
import { demoPassword, seedDemoUsers } from "../../prisma/seed";

const baseUrl = "http://localhost:3000/api/auth";

function requestWithCookie(cookie?: string): Request {
  return new Request(`${baseUrl}/get-session`, {
    ...(cookie ? { headers: { cookie } } : {}),
  });
}

async function postAuth(
  path: string,
  body: Record<string, unknown>,
  cookie?: string,
) {
  return authRouteHandlers.POST(
    new Request(`${baseUrl}${path}`, {
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        ...(cookie ? { cookie } : {}),
      },
      method: "POST",
    }),
  );
}

function sessionCookie(response: Response): string {
  const setCookie = response.headers.get("set-cookie");

  if (!setCookie) {
    throw new Error("Expected a session cookie from Better Auth.");
  }

  const [cookie] = setCookie.split(";");

  if (!cookie) {
    throw new Error("Expected a valid session cookie from Better Auth.");
  }

  return cookie;
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

describe("Better Auth integration", () => {
  beforeAll(async () => {
    await cleanDatabase();
    await seedDemoUsers(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("seeds the four deterministic demo users idempotently", async () => {
    await seedDemoUsers(db);

    const users = await db.user.findMany({
      orderBy: { email: "asc" },
      select: { email: true, role: true },
    });

    expect(users).toEqual([
      { email: "cliente1@projecao.local", role: "CUSTOMER" },
      { email: "cliente2@projecao.local", role: "CUSTOMER" },
      { email: "organizador@projecao.local", role: "ORGANIZER" },
      { email: "portaria@projecao.local", role: "GATE" },
    ]);
  });

  it("rejects public signup", async () => {
    const response = await postAuth("/sign-up/email", {
      email: "nao-deve-criar@projecao.local",
      name: "Tentativa Pública",
      password: demoPassword,
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "EMAIL_PASSWORD_SIGN_UP_DISABLED",
    });
    await expect(
      db.user.findUnique({ where: { email: "nao-deve-criar@projecao.local" } }),
    ).resolves.toBeNull();
  });

  it("creates, reads and revokes a customer session through login and logout", async () => {
    const loginResponse = await postAuth("/sign-in/email", {
      email: "cliente1@projecao.local",
      password: demoPassword,
    });

    expect(loginResponse.status).toBe(200);
    const cookie = sessionCookie(loginResponse);
    const authenticatedRequest = requestWithCookie(cookie);

    await expect(getSession(authenticatedRequest)).resolves.toMatchObject({
      user: {
        email: "cliente1@projecao.local",
        role: "CUSTOMER",
      },
    });
    await expect(requireUser(authenticatedRequest)).resolves.toMatchObject({
      user: { role: "CUSTOMER" },
    });
    await expect(requireRole(authenticatedRequest, "CUSTOMER")).resolves.toMatchObject({
      user: { role: "CUSTOMER" },
    });
    await expect(requireRole(authenticatedRequest, "ORGANIZER")).rejects.toBeInstanceOf(
      AuthorizationError,
    );

    const session = await requireUser(authenticatedRequest);
    await expect(requireOwner(authenticatedRequest, session.user.id)).resolves.toMatchObject({
      user: { id: session.user.id },
    });
    await expect(requireOwner(authenticatedRequest, "outro-usuario")).rejects.toBeInstanceOf(
      AuthorizationError,
    );

    const logoutResponse = await postAuth("/sign-out", {}, cookie);
    expect(logoutResponse.status).toBe(200);
    await expect(getSession(authenticatedRequest)).resolves.toBeNull();
  });

  it("rejects requests without a valid session", async () => {
    await expect(getSession(requestWithCookie())).resolves.toBeNull();
    await expect(requireUser(requestWithCookie())).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });
});

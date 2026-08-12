import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthSession, UserRole } from "@/modules/auth";

const mocks = vi.hoisted(() => ({
  getEventSeatsByIds: vi.fn(),
  getPublishedEvent: vi.fn(),
  getRoleHomePath: vi.fn(),
  getSession: vi.fn(),
  headers: vi.fn(),
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound, redirect: mocks.redirect }));
vi.mock("@/modules/auth", () => ({
  getRoleHomePath: mocks.getRoleHomePath,
  getSession: mocks.getSession,
}));
vi.mock("@/modules/events", () => ({
  EventNotFoundError: class EventNotFoundError extends Error {},
  getPublishedEvent: mocks.getPublishedEvent,
}));
vi.mock("@/modules/seats", () => ({
  EventSeatMismatchError: class EventSeatMismatchError extends Error {},
  getEventSeatsByIds: mocks.getEventSeatsByIds,
}));

import CheckoutPage from "@/app/checkout/page";
import { CheckoutForm } from "@/components/checkout-form";

function sessionFor(role: UserRole): AuthSession {
  return {
    session: { expiresAt: new Date("2026-08-11T12:00:00.000Z"), id: "session-id" },
    user: { email: "user@example.com", id: "user-id", image: null, name: "Demo", role },
  };
}

function containsElementType(node: ReactNode, type: ReactElement["type"]): boolean {
  if (!isValidElement(node)) return false;
  if (node.type === type) return true;

  return Children.toArray((node as ReactElement<{ children?: ReactNode }>).props.children)
    .some((child) => containsElementType(child, type));
}

const searchParams = Promise.resolve({ eventId: "event-id", seatId: "seat-id" });

describe("checkout role experience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.redirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
  });

  it.each([
    ["ORGANIZER", "/organizer"],
    ["GATE", "/gate"],
  ] as const)("redirects %s before rendering checkout", async (role, destination) => {
    mocks.getSession.mockResolvedValue(sessionFor(role));
    mocks.getRoleHomePath.mockReturnValue(destination);

    await expect(CheckoutPage({ searchParams })).rejects.toThrow(`redirect:${destination}`);
    expect(mocks.getPublishedEvent).not.toHaveBeenCalled();
  });

  it("keeps checkout available for a customer", async () => {
    mocks.getSession.mockResolvedValue(sessionFor("CUSTOMER"));
    mocks.getPublishedEvent.mockResolvedValue({
      id: "event-id",
      movie: { posterPath: "/poster.png", title: "Filme" },
      priceCents: 3000,
      roomName: "Sala 1",
      startsAt: "2026-08-11T18:00:00.000Z",
      venueName: "Cine Projeção",
    });
    mocks.getEventSeatsByIds.mockResolvedValue([{ id: "seat-id", label: "A1" }]);

    const page = await CheckoutPage({ searchParams });

    expect(containsElementType(page, CheckoutForm)).toBe(true);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

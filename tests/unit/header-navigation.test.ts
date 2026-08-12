import { describe, expect, it } from "vitest";

import { isActiveNavigationPath } from "@/components/header-navigation";

describe("header navigation active state", () => {
  it("marks programming and tickets only on their appropriate paths", () => {
    expect(isActiveNavigationPath("/events/event-1", "/")).toBe(true);
    expect(isActiveNavigationPath("/tickets/ticket-1", "/tickets")).toBe(true);
    expect(isActiveNavigationPath("/checkout", "/")).toBe(false);
  });

  it("keeps the organizer area active on its nested routes", () => {
    expect(isActiveNavigationPath("/organizer/events/event-1", "/organizer")).toBe(true);
  });
});

import { describe, expect, it } from "vitest";

import { getGateAdmissionState, isCustomerSaleOpen } from "@/modules/events/event-temporal";

describe("event temporal policy", () => {
  const startsAt = new Date("2026-08-12T23:00:00.000Z");

  it("closes customer sales exactly at the scheduled start", () => {
    expect(isCustomerSaleOpen(startsAt, new Date("2026-08-12T22:59:59.999Z"))).toBe(true);
    expect(isCustomerSaleOpen(startsAt, startsAt)).toBe(false);
  });

  it("keeps gate admission active until the end of the local session day", () => {
    expect(getGateAdmissionState(startsAt, new Date("2026-08-12T22:00:00.000Z"))).toBe("NOT_STARTED");
    expect(getGateAdmissionState(startsAt, new Date("2026-08-13T02:50:00.000Z"))).toBe("ACTIVE");
    expect(getGateAdmissionState(startsAt, new Date("2026-08-13T03:00:00.000Z"))).toBe("EXPIRED");
  });
});

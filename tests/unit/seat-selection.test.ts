import { describe, expect, it } from "vitest";

import { toggleSeatSelection } from "@/modules/seats/seat-selection";

const availableSeat = {
  id: "seat-a1",
  label: "A1",
  rowLabel: "A",
  seatNumber: 1,
  status: "AVAILABLE" as const,
};

const soldSeat = {
  id: "seat-a2",
  label: "A2",
  rowLabel: "A",
  seatNumber: 2,
  status: "SOLD" as const,
};

describe("seat selection", () => {
  it("selects and unselects only available seats", () => {
    const selected = toggleSeatSelection([], availableSeat);

    expect(selected).toEqual(["seat-a1"]);
    expect(toggleSeatSelection(selected, availableSeat)).toEqual([]);
  });

  it("keeps sold seats out of the local selection", () => {
    expect(toggleSeatSelection(["seat-a1"], soldSeat)).toEqual(["seat-a1"]);
  });
});

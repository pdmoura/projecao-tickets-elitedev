import type { EventSeat } from "./seats.types";

export function toggleSeatSelection(
  selectedSeatIds: readonly string[],
  seat: EventSeat,
): string[] {
  if (seat.status === "SOLD") {
    return [...selectedSeatIds];
  }

  return selectedSeatIds.includes(seat.id)
    ? selectedSeatIds.filter((seatId) => seatId !== seat.id)
    : [...selectedSeatIds, seat.id];
}

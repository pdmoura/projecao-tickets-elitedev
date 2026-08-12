import type { EventSeat } from "./seats.types";

export type SeatAvailabilityMerge = {
  seats: EventSeat[];
  selectedSeatIds: string[];
  unavailableSeatLabels: string[];
};

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

export function mergeSeatAvailability(
  currentSeats: readonly EventSeat[],
  selectedSeatIds: readonly string[],
  remoteSeats: readonly EventSeat[],
): SeatAvailabilityMerge {
  const remoteSeatsById = new Map(remoteSeats.map((seat) => [seat.id, seat]));
  const unavailableSeats = selectedSeatIds.flatMap((seatId) => {
    const remoteSeat = remoteSeatsById.get(seatId);

    return remoteSeat?.status === "SOLD" ? [remoteSeat] : [];
  });
  const unavailableSeatIds = new Set(unavailableSeats.map((seat) => seat.id));

  return {
    seats: remoteSeats.length > 0 ? [...remoteSeats] : [...currentSeats],
    selectedSeatIds: selectedSeatIds.filter(
      (seatId) => !unavailableSeatIds.has(seatId),
    ),
    unavailableSeatLabels: unavailableSeats.map((seat) => seat.label),
  };
}

export class EventSeatMismatchError extends Error {
  readonly code = "EVENT_SEAT_MISMATCH";
  readonly status = 400;

  constructor() {
    super("Um ou mais assentos não pertencem a esta sessão.");
    this.name = "EventSeatMismatchError";
  }
}

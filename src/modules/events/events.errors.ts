export class EventNotFoundError extends Error {
  readonly code = "EVENT_NOT_FOUND";
  readonly status = 404;

  constructor() {
    super("A sessão não está disponível.");
    this.name = "EventNotFoundError";
  }
}

export class EventAlreadyStartedError extends Error {
  readonly code = "EVENT_ALREADY_STARTED";
  readonly status = 409;

  constructor() {
    super("A sessão já começou e não está mais disponível para compra.");
    this.name = "EventAlreadyStartedError";
  }
}

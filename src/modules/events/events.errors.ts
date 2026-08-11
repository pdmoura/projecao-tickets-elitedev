export class EventNotFoundError extends Error {
  readonly code = "EVENT_NOT_FOUND";
  readonly status = 404;

  constructor() {
    super("A sessão não está disponível.");
    this.name = "EventNotFoundError";
  }
}

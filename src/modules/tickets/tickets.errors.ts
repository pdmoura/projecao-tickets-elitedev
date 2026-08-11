export class TicketNotFoundError extends Error {
  readonly code = "RESOURCE_NOT_FOUND";
  readonly status = 404;

  constructor() {
    super("Ingresso não encontrado.");
    this.name = "TicketNotFoundError";
  }
}

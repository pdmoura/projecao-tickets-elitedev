export class CheckInValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "CheckInValidationError";
  }
}

export class EventNotStartedError extends Error {
  readonly code = "EVENT_NOT_STARTED";
  readonly status = 409;

  constructor() {
    super("A validação estará disponível a partir do horário da sessão.");
    this.name = "EventNotStartedError";
  }
}

export class EventExpiredError extends Error {
  readonly code = "EVENT_EXPIRED";
  readonly status = 409;

  constructor() {
    super("Esta sessão já terminou. Novas entradas não podem ser registradas.");
    this.name = "EventExpiredError";
  }
}

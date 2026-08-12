export class OrganizerEventValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "OrganizerEventValidationError";
  }
}

export class OrganizerEventOwnershipError extends Error {
  readonly code = "FORBIDDEN";
  readonly status = 403;

  constructor() {
    super("Você não tem permissão para gerenciar esta sessão.");
    this.name = "OrganizerEventOwnershipError";
  }
}

export class EventImmutableError extends Error {
  readonly code = "EVENT_IMMUTABLE";
  readonly status = 409;

  constructor() {
    super("Sessões publicadas não podem ser alteradas.");
    this.name = "EventImmutableError";
  }
}

export class EventHasTransactionHistoryError extends Error {
  readonly code = "EVENT_HAS_TRANSACTION_HISTORY";
  readonly status = 409;

  constructor() {
    super("Esta sessão já possui ingressos emitidos e não pode mais ter seus dados principais alterados.");
    this.name = "EventHasTransactionHistoryError";
  }
}

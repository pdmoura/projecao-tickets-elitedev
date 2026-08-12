export class CheckoutValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "CheckoutValidationError";
  }
}

export class PaymentDeclinedError extends Error {
  readonly code = "PAYMENT_DECLINED";
  readonly status = 402;

  constructor() {
    super("O pagamento simulado foi recusado.");
    this.name = "PaymentDeclinedError";
  }
}

export class UnsupportedTestCardError extends Error {
  readonly code = "TEST_CARD_UNSUPPORTED";
  readonly status = 400;

  constructor() {
    super("Cartão de teste não reconhecido.");
    this.name = "UnsupportedTestCardError";
  }
}

export class SeatUnavailableError extends Error {
  readonly code = "SEAT_UNAVAILABLE";
  readonly status = 409;

  constructor(
    readonly seatIds: string[],
    readonly seatLabels: string[] = [],
  ) {
    super("Um ou mais assentos não estão mais disponíveis.");
    this.name = "SeatUnavailableError";
  }
}

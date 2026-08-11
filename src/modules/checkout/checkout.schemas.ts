import { CheckoutValidationError } from "./checkout.errors";
import type { CheckoutInput, SimulatedCardInput } from "./checkout.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requireTrimmedString(value: unknown, message: string): string {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    throw new CheckoutValidationError(message);
  }

  return normalized;
}

function parsePayment(value: unknown): SimulatedCardInput {
  if (!isRecord(value) || value.method !== "SIMULATED_CARD") {
    throw new CheckoutValidationError("Forma de pagamento inválida.");
  }

  return {
    cardNumber: requireTrimmedString(value.cardNumber, "Informe o número do cartão."),
    cvv: requireTrimmedString(value.cvv, "Informe o CVV."),
    expiry: requireTrimmedString(value.expiry, "Informe a validade do cartão."),
    method: "SIMULATED_CARD",
  };
}

export function parseCheckoutInput(value: unknown): CheckoutInput {
  if (!isRecord(value)) {
    throw new CheckoutValidationError("Dados de checkout inválidos.");
  }

  const eventId = requireTrimmedString(value.eventId, "Informe a sessão.");

  if (!Array.isArray(value.seatIds) || value.seatIds.length === 0) {
    throw new CheckoutValidationError("Selecione pelo menos um assento.");
  }

  const seatIds = value.seatIds.map((seatId) =>
    requireTrimmedString(seatId, "Identificador de assento inválido."),
  );

  if (new Set(seatIds).size !== seatIds.length) {
    throw new CheckoutValidationError("A seleção contém assentos duplicados.");
  }

  return {
    eventId,
    payment: parsePayment(value.payment),
    seatIds,
  };
}

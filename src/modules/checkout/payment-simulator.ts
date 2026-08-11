import { CheckoutValidationError } from "./checkout.errors";
import type { SimulatedCardInput } from "./checkout.types";

export const approvedCardNumber = "4242424242424242";
export const declinedCardNumber = "4000000000000002";

export type SimulatedPaymentResult = "APPROVED" | "DECLINED";

function normalizeCardNumber(cardNumber: string): string {
  const normalized = cardNumber.replaceAll(" ", "");

  if (!/^\d{16}$/.test(normalized)) {
    throw new CheckoutValidationError("Número de cartão inválido.");
  }

  return normalized;
}

function validateExpiry(expiry: string, now: Date): void {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(expiry);

  if (!match) {
    throw new CheckoutValidationError("Validade inválida. Use MM/AA.");
  }

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const currentMonth = now.getUTCMonth() + 1;
  const currentYear = now.getUTCFullYear();

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    throw new CheckoutValidationError("O cartão informado está vencido.");
  }
}

export function simulatePayment(
  input: SimulatedCardInput,
  now = new Date(),
): SimulatedPaymentResult {
  const cardNumber = normalizeCardNumber(input.cardNumber);

  validateExpiry(input.expiry, now);

  if (!/^\d{3,4}$/.test(input.cvv)) {
    throw new CheckoutValidationError("CVV inválido.");
  }

  return cardNumber === approvedCardNumber ? "APPROVED" : "DECLINED";
}

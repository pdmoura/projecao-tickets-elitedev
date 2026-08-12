import { CheckoutValidationError } from "./checkout.errors";
import type {
  PaymentAuthorizationRequest,
  PaymentAuthorizationResult,
  PaymentProvider,
} from "./payment-provider";

export const simulatedTestCards = {
  approved: "4242 4242 4242 4242",
  declined: "4000 0000 0000 0002",
} as const;

const normalizedTestCards = {
  approved: simulatedTestCards.approved.replaceAll(" ", ""),
  declined: simulatedTestCards.declined.replaceAll(" ", ""),
} as const;

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

export function authorizeSimulatedPayment(
  input: PaymentAuthorizationRequest,
  now = new Date(),
): PaymentAuthorizationResult {
  if (!Number.isSafeInteger(input.amountCents) || input.amountCents <= 0) {
    throw new CheckoutValidationError("Valor do pagamento inválido.");
  }

  const cardNumber = normalizeCardNumber(input.payment.cardNumber);

  validateExpiry(input.payment.expiry, now);

  if (!/^\d{3,4}$/.test(input.payment.cvv)) {
    throw new CheckoutValidationError("CVV inválido.");
  }

  if (cardNumber === normalizedTestCards.approved) {
    return { status: "APPROVED" };
  }

  if (cardNumber === normalizedTestCards.declined) {
    return { status: "DECLINED" };
  }

  return { status: "UNSUPPORTED" };
}

export const simulatedPaymentProvider: PaymentProvider = {
  async authorize(input) {
    return authorizeSimulatedPayment(input);
  },
};

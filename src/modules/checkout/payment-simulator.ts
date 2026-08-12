import type { SimulatedCardInput } from "./checkout.types";
import {
  authorizeSimulatedPayment,
  simulatedTestCards,
} from "./simulated-payment-provider";

export const approvedCardNumber = simulatedTestCards.approved.replaceAll(" ", "");
export const declinedCardNumber = simulatedTestCards.declined.replaceAll(" ", "");

export type SimulatedPaymentResult = "APPROVED" | "DECLINED" | "UNSUPPORTED";

// Compatibility wrapper retained for focused tests and callers of the former simulator.
export function simulatePayment(
  input: SimulatedCardInput,
  now = new Date(),
): SimulatedPaymentResult {
  return authorizeSimulatedPayment({ amountCents: 1, payment: input }, now).status;
}

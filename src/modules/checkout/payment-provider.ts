import type { SimulatedCardInput } from "./checkout.types";

export type PaymentAuthorizationResult =
  | { status: "APPROVED" }
  | { status: "DECLINED" }
  | { status: "UNSUPPORTED" };

export type PaymentAuthorizationRequest = {
  amountCents: number;
  payment: SimulatedCardInput;
};

export interface PaymentProvider {
  authorize(
    input: PaymentAuthorizationRequest,
  ): Promise<PaymentAuthorizationResult>;
}

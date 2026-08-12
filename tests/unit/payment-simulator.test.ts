import { describe, expect, it } from "vitest";

import { CheckoutValidationError } from "@/modules/checkout/checkout.errors";
import { parseCheckoutInput } from "@/modules/checkout/checkout.schemas";
import {
  approvedCardNumber,
  declinedCardNumber,
  simulatePayment,
} from "@/modules/checkout/payment-simulator";
import { simulatedPaymentProvider } from "@/modules/checkout/simulated-payment-provider";

const basePayment = {
  cardNumber: approvedCardNumber,
  cvv: "123",
  expiry: "12/30",
  method: "SIMULATED_CARD" as const,
};

describe("payment simulator", () => {
  it("approves and declines the documented card values deterministically", () => {
    const now = new Date("2026-08-11T12:00:00.000Z");

    expect(
      simulatePayment(
        { ...basePayment, cardNumber: "4242 4242 4242 4242" },
        now,
      ),
    ).toBe("APPROVED");
    expect(
      simulatePayment({ ...basePayment, cardNumber: declinedCardNumber }, now),
    ).toBe("DECLINED");
    expect(
      simulatePayment({ ...basePayment, cardNumber: "5555 5555 5555 4444" }, now),
    ).toBe("UNSUPPORTED");
  });

  it("exposes the deterministic result through the payment-provider boundary", async () => {
    await expect(
      simulatedPaymentProvider.authorize({ amountCents: 3200, payment: basePayment }),
    ).resolves.toEqual({ status: "APPROVED" });
  });

  it("validates the expiry and CVV only for the current request", () => {
    const now = new Date("2026-08-11T12:00:00.000Z");

    expect(() =>
      simulatePayment({ ...basePayment, expiry: "07/26" }, now),
    ).toThrow(CheckoutValidationError);
    expect(() => simulatePayment({ ...basePayment, cvv: "12" }, now)).toThrow(
      CheckoutValidationError,
    );
  });
});

describe("checkout input", () => {
  it("rejects duplicate seat IDs", () => {
    expect(() =>
      parseCheckoutInput({
        eventId: "event-1",
        payment: basePayment,
        seatIds: ["seat-1", "seat-1"],
      }),
    ).toThrow("A seleção contém assentos duplicados.");
  });
});

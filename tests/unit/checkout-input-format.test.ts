import { describe, expect, it } from "vitest";

import {
  digitsOnly,
  formatCardNumber,
  validateCheckoutFields,
} from "@/components/checkout-input-format";

describe("checkout input formatting", () => {
  it("keeps only sixteen card digits and groups them in blocks of four", () => {
    expect(formatCardNumber("4242-ab42 42/4242 42-999")).toBe(
      "4242 4242 4242 4299",
    );
    expect(digitsOnly("12a3-4", 3)).toBe("123");
  });

  it("reports specific card, expiry and CVV messages", () => {
    expect(
      validateCheckoutFields({
        cardNumber: "4242",
        cvv: "12",
        expiry: "45/34",
        now: new Date("2026-08-12T12:00:00.000Z"),
      }),
    ).toEqual({
      cardNumber: "Digite os 16 números do cartão.",
      cvv: "Digite os 3 números do CVV.",
      expiry: "O mês deve estar entre 01 e 12.",
    });
  });

  it("rejects an expired date and accepts a future MM/AA date", () => {
    const now = new Date("2026-08-12T12:00:00.000Z");

    expect(
      validateCheckoutFields({
        cardNumber: "4242 4242 4242 4242",
        cvv: "123",
        expiry: "07/26",
        now,
      }),
    ).toEqual({ expiry: "Este cartão está vencido." });
    expect(
      validateCheckoutFields({
        cardNumber: "4242 4242 4242 4242",
        cvv: "123",
        expiry: "12/30",
        now,
      }),
    ).toEqual({});
  });
});

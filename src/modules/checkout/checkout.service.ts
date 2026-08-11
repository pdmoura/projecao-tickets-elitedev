import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { db } from "@/lib/db";

import {
  CheckoutValidationError,
  PaymentDeclinedError,
} from "./checkout.errors";
import {
  persistApprovedCheckout,
  persistDeclinedPayment,
} from "./checkout.repository";
import { simulatePayment } from "./payment-simulator";
import { createStoredTicketCredentials } from "./ticket-credentials";
import type { ApprovedCheckout, CheckoutInput } from "./checkout.types";

export function createCheckoutService(database: PrismaClient = db) {
  return {
    async checkout(
      customerId: string,
      input: CheckoutInput,
    ): Promise<ApprovedCheckout> {
      if (input.seatIds.length === 0) {
        throw new CheckoutValidationError("Selecione pelo menos um assento.");
      }

      if (new Set(input.seatIds).size !== input.seatIds.length) {
        throw new CheckoutValidationError("A seleção contém assentos duplicados.");
      }

      const seatIds = [...input.seatIds].sort((left, right) =>
        left.localeCompare(right),
      );
      const paymentResult = simulatePayment(input.payment);

      if (paymentResult === "DECLINED") {
        await persistDeclinedPayment(database, {
          customerId,
          eventId: input.eventId,
          seatIds,
        });
        throw new PaymentDeclinedError();
      }

      const tickets = seatIds.map((eventSeatId) => ({
        eventSeatId,
        ...createStoredTicketCredentials(),
      }));

      return persistApprovedCheckout(database, {
        customerId,
        eventId: input.eventId,
        seatIds,
        tickets,
      });
    },
  };
}

const checkoutService = createCheckoutService();

export const checkout = checkoutService.checkout;

import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { createStoredTicketCredentials } from "@/modules/tickets/ticket-credentials";

import {
  CheckoutValidationError,
  PaymentDeclinedError,
  UnsupportedTestCardError,
} from "./checkout.errors";
import {
  getCheckoutAmount,
  persistApprovedCheckout,
  persistDeclinedPayment,
} from "./checkout.repository";
import type { PaymentProvider } from "./payment-provider";
import { simulatedPaymentProvider } from "./simulated-payment-provider";
import type { ApprovedCheckout, CheckoutInput } from "./checkout.types";

export function createCheckoutService(
  database: PrismaClient = db,
  paymentProvider: PaymentProvider = simulatedPaymentProvider,
) {
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
      const amountCents = await getCheckoutAmount(database, {
        eventId: input.eventId,
        seatIds,
      });
      const paymentResult = await paymentProvider.authorize({
        amountCents,
        payment: input.payment,
      });

      if (paymentResult.status === "UNSUPPORTED") {
        throw new UnsupportedTestCardError();
      }

      if (paymentResult.status === "DECLINED") {
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

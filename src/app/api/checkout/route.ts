import { NextResponse } from "next/server";

import {
  AuthenticationError,
  AuthorizationError,
  requireRole,
} from "@/modules/auth";
import {
  checkout,
  CheckoutValidationError,
  parseCheckoutInput,
  PaymentDeclinedError,
  SeatUnavailableError,
} from "@/modules/checkout";
import { EventNotFoundError } from "@/modules/events";

function checkoutErrorResponse(error: unknown): NextResponse {
  if (
    error instanceof AuthenticationError ||
    error instanceof AuthorizationError ||
    error instanceof CheckoutValidationError ||
    error instanceof EventNotFoundError ||
    error instanceof PaymentDeclinedError
  ) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  if (error instanceof SeatUnavailableError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          details: {
            seatIds: error.seatIds,
            seatLabels: error.seatLabels,
          },
          message: error.message,
        },
      },
      { status: error.status },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Não foi possível concluir a compra.",
      },
    },
    { status: 500 },
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireRole(request, "CUSTOMER");
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      throw new CheckoutValidationError("Corpo da requisição inválido.");
    }

    const result = await checkout(session.user.id, parseCheckoutInput(body));

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return checkoutErrorResponse(error);
  }
}

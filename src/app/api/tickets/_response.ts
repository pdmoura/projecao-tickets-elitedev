import { NextResponse } from "next/server";

import {
  AuthenticationError,
  AuthorizationError,
} from "@/modules/auth";
import { TicketNotFoundError } from "@/modules/tickets";

export function ticketErrorResponse(error: unknown): NextResponse {
  if (
    error instanceof AuthenticationError ||
    error instanceof AuthorizationError ||
    error instanceof TicketNotFoundError
  ) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Não foi possível carregar os ingressos.",
      },
    },
    { status: 500 },
  );
}

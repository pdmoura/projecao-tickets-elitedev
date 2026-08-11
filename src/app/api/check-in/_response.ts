import { NextResponse } from "next/server";

import {
  AuthenticationError,
  AuthorizationError,
} from "@/modules/auth";
import { CheckInValidationError } from "@/modules/check-in";
import { EventNotFoundError } from "@/modules/events";

export async function readCheckInBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new CheckInValidationError("Corpo da requisição inválido.");
  }
}

export function checkInErrorResponse(error: unknown): NextResponse {
  if (
    error instanceof AuthenticationError ||
    error instanceof AuthorizationError ||
    error instanceof CheckInValidationError ||
    error instanceof EventNotFoundError
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
        message: "Não foi possível validar o ingresso.",
      },
    },
    { status: 500 },
  );
}

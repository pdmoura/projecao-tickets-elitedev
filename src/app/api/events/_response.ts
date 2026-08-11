import { NextResponse } from "next/server";

import { EventNotFoundError } from "@/modules/events";
import { EventSeatMismatchError } from "@/modules/seats";

export function eventErrorResponse(error: unknown): NextResponse {
  if (
    error instanceof EventNotFoundError ||
    error instanceof EventSeatMismatchError
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
        message: "Não foi possível carregar esta sessão.",
      },
    },
    { status: 500 },
  );
}

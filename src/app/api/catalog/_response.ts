import { NextResponse } from "next/server";

import {
  AuthenticationError,
  AuthorizationError,
} from "@/modules/auth";
import {
  CatalogUnavailableError,
  CatalogValidationError,
} from "@/modules/catalog";

export function catalogErrorResponse(error: unknown): NextResponse {
  if (
    error instanceof AuthenticationError ||
    error instanceof AuthorizationError ||
    error instanceof CatalogUnavailableError ||
    error instanceof CatalogValidationError
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
        message: "Não foi possível processar a solicitação.",
      },
    },
    { status: 500 },
  );
}

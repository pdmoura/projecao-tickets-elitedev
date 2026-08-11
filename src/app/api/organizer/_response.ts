import { NextResponse } from "next/server";

import {
  AuthenticationError,
  AuthorizationError,
} from "@/modules/auth";
import {
  EventImmutableError,
  OrganizerEventOwnershipError,
  OrganizerEventValidationError,
} from "@/modules/events";
import { CatalogUnavailableError, CatalogValidationError } from "@/modules/catalog";

export function organizerErrorResponse(error: unknown): NextResponse {
  if (
    error instanceof AuthenticationError ||
    error instanceof AuthorizationError ||
    error instanceof OrganizerEventOwnershipError ||
    error instanceof OrganizerEventValidationError ||
    error instanceof EventImmutableError ||
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
        message: "Não foi possível processar a sessão.",
      },
    },
    { status: 500 },
  );
}

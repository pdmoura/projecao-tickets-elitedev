import { NextResponse } from "next/server";

import { requireRole } from "@/modules/auth";
import {
  checkInByValidationToken,
  parseQrCheckInInput,
} from "@/modules/check-in";

import { checkInErrorResponse, readCheckInBody } from "../_response";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireRole(request, "GATE");
    const input = parseQrCheckInInput(await readCheckInBody(request));

    return NextResponse.json(
      await checkInByValidationToken(session.user.id, input),
    );
  } catch (error) {
    return checkInErrorResponse(error);
  }
}

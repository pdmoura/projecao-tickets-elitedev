import { NextResponse } from "next/server";

import { requireRole } from "@/modules/auth";
import {
  checkInByManualCode,
  parseManualCheckInInput,
} from "@/modules/check-in";

import { checkInErrorResponse, readCheckInBody } from "../_response";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireRole(request, "GATE");
    const input = parseManualCheckInInput(await readCheckInBody(request));

    return NextResponse.json(
      await checkInByManualCode(session.user.id, input),
    );
  } catch (error) {
    return checkInErrorResponse(error);
  }
}

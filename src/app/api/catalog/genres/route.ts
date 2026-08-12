import { NextResponse } from "next/server";

import { requireRole } from "@/modules/auth";
import { listGenres } from "@/modules/catalog";

import { catalogErrorResponse } from "../_response";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireRole(request, "ORGANIZER");

    return NextResponse.json({ items: await listGenres() });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}

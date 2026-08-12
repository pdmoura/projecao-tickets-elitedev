import { NextResponse } from "next/server";

import { requireRole } from "@/modules/auth";
import { discoverMovies } from "@/modules/catalog";
import { parseDiscoverMoviesInput } from "@/modules/catalog/catalog.schemas";

import { catalogErrorResponse } from "../_response";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireRole(request, "ORGANIZER");

    return NextResponse.json(
      await discoverMovies(parseDiscoverMoviesInput(new URL(request.url).searchParams)),
    );
  } catch (error) {
    return catalogErrorResponse(error);
  }
}

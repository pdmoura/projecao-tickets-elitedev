import { NextResponse } from "next/server";

import { requireRole } from "@/modules/auth";
import { searchMovies } from "@/modules/catalog";
import { parseSearchMoviesInput } from "@/modules/catalog/catalog.schemas";

import { catalogErrorResponse } from "../_response";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireRole(request, "ORGANIZER");

    const { page, query } = parseSearchMoviesInput(
      new URL(request.url).searchParams,
    );
    const result = await searchMovies(query, page);

    return NextResponse.json(result);
  } catch (error) {
    return catalogErrorResponse(error);
  }
}

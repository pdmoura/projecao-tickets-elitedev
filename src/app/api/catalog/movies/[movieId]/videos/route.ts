import { NextResponse } from "next/server";

import { requireRole } from "@/modules/auth";
import { getMovieVideos } from "@/modules/catalog";
import { parseMovieId } from "@/modules/catalog/catalog.schemas";

import { catalogErrorResponse } from "../../../_response";

type RouteContext = {
  params: Promise<{ movieId: string }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  try {
    await requireRole(request, "ORGANIZER");

    const { movieId } = await params;
    const result = await getMovieVideos(parseMovieId(movieId));

    return NextResponse.json(result);
  } catch (error) {
    return catalogErrorResponse(error);
  }
}

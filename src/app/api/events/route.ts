import { NextResponse } from "next/server";

import { listPublishedEvents } from "@/modules/events";

import { eventErrorResponse } from "./_response";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const search = new URL(request.url).searchParams.get("search") ?? undefined;

    return NextResponse.json(await listPublishedEvents(search));
  } catch (error) {
    return eventErrorResponse(error);
  }
}

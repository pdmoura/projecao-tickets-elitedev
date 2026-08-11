import { NextResponse } from "next/server";

import { getPublishedEvent } from "@/modules/events";

import { eventErrorResponse } from "../_response";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  try {
    const { eventId } = await params;

    return NextResponse.json(await getPublishedEvent(eventId));
  } catch (error) {
    return eventErrorResponse(error);
  }
}

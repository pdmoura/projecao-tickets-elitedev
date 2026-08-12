import { NextResponse } from "next/server";

import { getPublicEvent } from "@/modules/events";

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

    return NextResponse.json(await getPublicEvent(eventId));
  } catch (error) {
    return eventErrorResponse(error);
  }
}

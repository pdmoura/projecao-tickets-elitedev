import { NextResponse } from "next/server";

import { getEventSeats } from "@/modules/seats";

import { eventErrorResponse } from "../../_response";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  try {
    const { eventId } = await params;

    return NextResponse.json({
      eventId,
      seats: await getEventSeats(eventId),
    });
  } catch (error) {
    return eventErrorResponse(error);
  }
}

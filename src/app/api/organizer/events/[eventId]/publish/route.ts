import { NextResponse } from "next/server";

import { requireRole } from "@/modules/auth";
import { publishOrganizerEvent } from "@/modules/events";

import { organizerErrorResponse } from "../../../_response";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  try {
    const session = await requireRole(request, "ORGANIZER");
    const { eventId } = await params;

    return NextResponse.json(
      await publishOrganizerEvent(session.user.id, eventId),
    );
  } catch (error) {
    return organizerErrorResponse(error);
  }
}

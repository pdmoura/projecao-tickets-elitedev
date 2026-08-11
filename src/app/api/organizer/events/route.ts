import { NextResponse } from "next/server";

import { requireRole } from "@/modules/auth";
import {
  createOrganizerDraft,
  listOrganizerEvents,
} from "@/modules/events";
import { parseOrganizerEventDraftInput } from "@/modules/events/organizer-events.schemas";

import { organizerErrorResponse } from "../_response";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await requireRole(request, "ORGANIZER");

    return NextResponse.json(await listOrganizerEvents(session.user.id));
  } catch (error) {
    return organizerErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireRole(request, "ORGANIZER");
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      body = null;
    }

    const event = await createOrganizerDraft(
      session.user.id,
      parseOrganizerEventDraftInput(body).movieExternalId,
    );

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    return organizerErrorResponse(error);
  }
}

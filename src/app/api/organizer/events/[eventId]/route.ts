import { NextResponse } from "next/server";

import { requireRole } from "@/modules/auth";
import {
  changeOrganizerDraftMovie,
  deleteOrganizerDraft,
  getOrganizerEvent,
  updateOrganizerDraft,
} from "@/modules/events";
import {
  parseOrganizerEventDraftInput,
  parseOrganizerEventUpdateInput,
} from "@/modules/events/organizer-events.schemas";

import { organizerErrorResponse } from "../../_response";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  try {
    const session = await requireRole(request, "ORGANIZER");
    const { eventId } = await params;

    return NextResponse.json(await getOrganizerEvent(session.user.id, eventId));
  } catch (error) {
    return organizerErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  try {
    const session = await requireRole(request, "ORGANIZER");
    const { eventId } = await params;
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      body = null;
    }

    return NextResponse.json(
      await updateOrganizerDraft(
        session.user.id,
        eventId,
        parseOrganizerEventUpdateInput(body),
      ),
    );
  } catch (error) {
    return organizerErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  try {
    const session = await requireRole(request, "ORGANIZER");
    const { eventId } = await params;
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      body = null;
    }

    return NextResponse.json(
      await changeOrganizerDraftMovie(
        session.user.id,
        eventId,
        parseOrganizerEventDraftInput(body).movieExternalId,
      ),
    );
  } catch (error) {
    return organizerErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  try {
    const session = await requireRole(request, "ORGANIZER");
    const { eventId } = await params;

    await deleteOrganizerDraft(session.user.id, eventId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return organizerErrorResponse(error);
  }
}

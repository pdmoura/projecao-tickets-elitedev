import { NextResponse } from "next/server";

import { requireRole } from "@/modules/auth";
import { getTicket } from "@/modules/tickets";

import { ticketErrorResponse } from "../_response";

type TicketRouteContext = {
  params: Promise<{ ticketId: string }>;
};

export async function GET(
  request: Request,
  context: TicketRouteContext,
): Promise<NextResponse> {
  try {
    const session = await requireRole(request, "CUSTOMER");
    const { ticketId } = await context.params;

    return NextResponse.json(await getTicket(session.user.id, ticketId));
  } catch (error) {
    return ticketErrorResponse(error);
  }
}

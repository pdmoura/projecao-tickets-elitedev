import { NextResponse } from "next/server";

import { requireRole } from "@/modules/auth";
import { listTickets } from "@/modules/tickets";

import { ticketErrorResponse } from "./_response";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await requireRole(request, "CUSTOMER");

    return NextResponse.json({ items: await listTickets(session.user.id) });
  } catch (error) {
    return ticketErrorResponse(error);
  }
}

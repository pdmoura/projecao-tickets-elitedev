import { NextResponse } from "next/server";

import { getRoleHomePath, getSession } from "@/modules/auth";

export async function GET(request: Request) {
  const session = await getSession(request);
  const destination = session ? getRoleHomePath(session.user.role) : "/login";

  return NextResponse.redirect(new URL(destination, request.url));
}

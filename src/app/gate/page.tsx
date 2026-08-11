import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { GateCheckIn } from "@/components/gate-check-in";
import { LogoutButton } from "@/modules/auth/logout-button";
import { getRoleHomePath, getSession } from "@/modules/auth";
import { listPublishedEvents } from "@/modules/events";

export const dynamic = "force-dynamic";

export default async function GatePage() {
  const request = new Request("http://localhost", { headers: await headers() });
  const session = await getSession(request);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "GATE") {
    redirect(getRoleHomePath(session.user.role));
  }

  const events = await listPublishedEvents();

  return (
    <main className="min-h-screen bg-gate-bg px-6 py-8 text-gate-text sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between border-b border-gate-border pb-5">
          <BrandLogo inverse priority />
          <div className="flex items-center gap-5">
            <p className="hidden font-code text-xs uppercase tracking-[0.18em] text-gate-muted sm:block">
              Portaria · {session.user.name}
            </p>
            <LogoutButton inverse />
          </div>
        </header>
        <div className="mx-auto max-w-3xl py-10 sm:py-14">
          <GateCheckIn events={events} />
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { OrganizerMovieSearch } from "@/components/organizer-movie-search";
import { LogoutButton } from "@/modules/auth/logout-button";
import { getRoleHomePath, getSession } from "@/modules/auth";

export const dynamic = "force-dynamic";

export default async function NewOrganizerEventPage() {
  const request = new Request("http://localhost", { headers: await headers() });
  const session = await getSession(request);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ORGANIZER") {
    redirect(getRoleHomePath(session.user.role));
  }

  return (
    <main className="min-h-screen bg-paper px-6 py-8 text-ink sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-rule pb-5">
          <BrandLogo priority />
          <nav aria-label="Navegação do organizador" className="flex items-center gap-5">
            <Link className="font-code text-xs font-medium uppercase tracking-[0.14em] text-ink underline decoration-accent decoration-2 underline-offset-4" href="/organizer">
              Minhas sessões
            </Link>
            <LogoutButton />
          </nav>
        </header>
        <OrganizerMovieSearch />
      </div>
    </main>
  );
}

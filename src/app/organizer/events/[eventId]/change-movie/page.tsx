import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { OrganizerMovieSearch } from "@/components/organizer-movie-search";
import { LogoutButton } from "@/modules/auth/logout-button";
import { getRoleHomePath, getSession } from "@/modules/auth";
import { getOrganizerEvent, OrganizerEventOwnershipError } from "@/modules/events";

export const dynamic = "force-dynamic";

export default async function ChangeOrganizerMoviePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const request = new Request("http://localhost", { headers: await headers() });
  const session = await getSession(request);

  if (!session) redirect("/login");
  if (session.user.role !== "ORGANIZER") redirect(getRoleHomePath(session.user.role));

  const { eventId } = await params;
  let event;
  try {
    event = await getOrganizerEvent(session.user.id, eventId);
  } catch (error) {
    if (error instanceof OrganizerEventOwnershipError) notFound();
    throw error;
  }

  if (event.status === "PUBLISHED") redirect(`/organizer/events/${eventId}`);

  return (
    <main className="min-h-screen bg-paper px-6 py-8 text-ink sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-rule pb-5">
          <BrandLogo priority />
          <nav aria-label="Navegação do organizador" className="flex items-center gap-5">
            <Link className="font-code text-xs font-medium uppercase tracking-[0.14em] underline decoration-accent decoration-2 underline-offset-4" href={`/organizer/events/${eventId}`}>Voltar ao rascunho</Link>
            <LogoutButton />
          </nav>
        </header>
        <section className="pt-8">
          <div className="flex items-center gap-4 border border-rule bg-surface p-4">
            <Image
              alt={`Pôster de ${event.movie.title}`}
              className="aspect-[2/3] w-16 border border-rule object-cover"
              height={144}
              src={event.movie.posterPath}
              width={96}
            />
            <p className="text-sm text-ink-muted">
              Filme atual: <strong className="text-ink">{event.movie.title}</strong>
            </p>
          </div>
          <OrganizerMovieSearch eventId={eventId} />
        </section>
      </div>
    </main>
  );
}

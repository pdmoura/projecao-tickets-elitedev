import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { LogoutButton } from "@/modules/auth/logout-button";
import { getRoleHomePath, getSession } from "@/modules/auth";
import { formatCurrency, formatEventDate } from "@/modules/events/event-format";
import { listOrganizerEvents } from "@/modules/events";

export const dynamic = "force-dynamic";

export default async function OrganizerPage() {
  const request = new Request("http://localhost", { headers: await headers() });
  const session = await getSession(request);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ORGANIZER") {
    redirect(getRoleHomePath(session.user.role));
  }

  const events = await listOrganizerEvents(session.user.id);

  return (
    <main className="min-h-screen bg-paper px-6 py-8 text-ink sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-rule pb-5">
          <BrandLogo priority />
          <nav aria-label="Navegação do organizador" className="flex items-center gap-5">
            <Link className="font-code text-xs font-medium uppercase tracking-[0.14em] text-ink underline decoration-accent decoration-2 underline-offset-4" href="/">
              Programação
            </Link>
            <LogoutButton />
          </nav>
        </header>

        <section className="py-12 sm:py-16">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="font-code text-xs uppercase tracking-[0.2em] text-accent">Área do organizador</p>
              <h1 className="mt-3 font-display text-5xl leading-[0.95] sm:text-6xl">Minhas sessões</h1>
              <p className="mt-5 max-w-xl leading-7 text-ink-muted">
                Acompanhe os rascunhos e as sessões que você publicou.
              </p>
            </div>
            <Link className="bg-accent px-5 py-3 text-center text-sm font-semibold text-ink hover:bg-accent-hover" href="/organizer/new">
              + Nova sessão
            </Link>
          </div>
        </section>

        {events.length === 0 ? (
          <section className="border-y border-rule py-16 text-center">
            <h2 className="font-display text-3xl">Sua programação começa aqui</h2>
            <p className="mt-3 text-ink-muted">Busque um filme no TMDb para criar a primeira sessão.</p>
            <Link className="mt-6 inline-block bg-accent px-5 py-3 text-sm font-semibold text-ink hover:bg-accent-hover" href="/organizer/new">
              Criar nova sessão
            </Link>
          </section>
        ) : (
          <section aria-label="Sessões do organizador" className="grid gap-4 pb-16">
            {events.map((event) => (
              <article className="grid gap-5 border border-rule bg-surface p-4 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:p-5" key={event.id}>
                <Image alt="" className="aspect-[2/3] w-24 border border-rule object-cover sm:w-full" height={360} src={event.movie.posterPath} width={240} />
                <div className="min-w-0">
                  <p className={`inline-block border px-2 py-1 font-code text-[0.65rem] uppercase tracking-[0.12em] ${event.status === "PUBLISHED" ? "border-success text-success" : "border-warning text-warning"}`}>
                    {event.status === "PUBLISHED" ? "Publicada" : "Rascunho"}
                  </p>
                  <h2 className="mt-3 font-display text-3xl leading-tight">{event.movie.title}</h2>
                  <p className="mt-3 text-sm text-ink-muted">
                    {event.startsAt ? formatEventDate(event.startsAt) : "Defina data e horário"}
                  </p>
                  <p className="mt-2 text-sm text-ink-muted">
                    {event.venueName && event.roomName ? `${event.venueName} · ${event.roomName}` : "Defina local e sala"}
                  </p>
                  <p className="mt-3 font-code text-xs uppercase tracking-[0.12em] text-ink-muted">
                    {event.priceCents === null ? "Preço pendente" : formatCurrency(event.priceCents)}
                    {event.capacity ? ` · ${event.capacity} lugares` : ""}
                  </p>
                </div>
                <Link className="h-fit border border-rule px-4 py-3 text-center text-sm font-semibold hover:bg-surface-secondary" href={`/organizer/events/${event.id}`}>
                  {event.status === "PUBLISHED" ? "Ver sessão" : "Editar rascunho"}
                </Link>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

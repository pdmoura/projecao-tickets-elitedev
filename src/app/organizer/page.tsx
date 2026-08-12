import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Circle, Eye, Pencil, RefreshCw, Send } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { DeleteOrganizerDraftButton } from "@/components/delete-organizer-draft-button";
import { getRoleHomePath, getSession } from "@/modules/auth";
import { formatCurrency, formatEventDate } from "@/modules/events/event-format";
import { listOrganizerEvents, type OrganizerEvent } from "@/modules/events";

export const dynamic = "force-dynamic";

function EventCard({ event }: { event: OrganizerEvent }) {
  const stateClasses = event.status === "DRAFT"
    ? "border-ink bg-ink text-accent"
    : event.isPast
      ? "border-ink-muted bg-surface-secondary text-ink"
      : "border-success bg-success/10 text-success";
  const stateLabel = event.status === "DRAFT" ? "Rascunho" : event.isPast ? "Encerrada" : "Publicada";

  return (
    <article className="grid gap-5 border border-rule bg-surface p-4 shadow-[0_1px_0_rgba(20,20,20,0.03)] sm:grid-cols-[8rem_minmax(0,1fr)] sm:p-5">
      <Image alt="" className="aspect-[2/3] w-24 self-start border border-rule object-cover sm:w-full" height={360} src={event.movie.posterPath} width={240} />
      <div className="min-w-0">
        <p className={`inline-flex items-center gap-2 border px-2.5 py-1.5 font-code text-[0.68rem] font-medium uppercase tracking-[0.13em] ${stateClasses}`}>
          <span aria-hidden="true" className={`size-1.5 rounded-full ${event.status === "DRAFT" ? "bg-accent" : event.isPast ? "bg-ink-muted" : "bg-success"}`} />
          {stateLabel}
        </p>
        <h2 className="mt-3 font-display text-3xl leading-tight text-balance">{event.movie.title}</h2>
        <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm text-ink-muted sm:grid-cols-2">
          <div className="flex items-start gap-2"><span aria-hidden="true" className="mt-0.5 text-accent">◷</span><div><dt className="sr-only">Data</dt><dd>{event.startsAt ? formatEventDate(event.startsAt) : "Defina data e horário"}</dd></div></div>
          <div className="flex items-start gap-2"><span aria-hidden="true" className="mt-0.5 text-accent">⌖</span><div><dt className="sr-only">Local</dt><dd>{event.venueName && event.roomName ? `${event.venueName} · ${event.roomName}` : "Defina local e sala"}</dd></div></div>
          <div className="flex items-start gap-2"><span aria-hidden="true" className="mt-0.5 text-accent">R$</span><div><dt className="sr-only">Preço</dt><dd>{event.priceCents === null ? "Preço pendente" : formatCurrency(event.priceCents)}</dd></div></div>
          <div className="flex items-start gap-2"><span aria-hidden="true" className="mt-0.5 text-accent">◉</span><div><dt className="sr-only">Capacidade</dt><dd>{event.capacity ? `${event.capacity} lugares` : "Capacidade pendente"}</dd></div></div>
        </dl>
      </div>
      {!event.canEdit ? (
        <footer className="flex flex-col items-center gap-3 border-t border-rule pt-4 sm:col-span-2 sm:flex-row sm:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-ink-muted">{event.hasTransactionalHistory ? "Esta sessão possui histórico de ingressos e foi preservada para consulta." : "Esta sessão não pode mais ser alterada."}</p>
          <Link className="inline-flex cursor-pointer items-center justify-center gap-2 self-start border border-rule px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:self-auto" href={`/organizer/events/${event.id}`}><Eye aria-hidden="true" className="size-[18px]" strokeWidth={1.8} /> Ver sessão</Link>
        </footer>
      ) : (
        <footer className="flex flex-col items-center gap-3 border-t border-rule pt-4 sm:col-span-2 sm:flex-row sm:justify-between">
          {event.status === "DRAFT" ? (
            <div className="flex items-center justify-center gap-3 sm:justify-start">
              <p className="inline-flex items-center gap-2 font-code text-[0.7rem] font-medium uppercase tracking-[0.12em] text-ink-muted">
                <Circle aria-hidden="true" className="size-3 fill-accent text-accent" strokeWidth={2} /> Rascunho
              </p>
              <Link aria-label="Configurar e publicar sessão" className="group inline-flex cursor-pointer items-center gap-1.5 border border-accent bg-accent px-3 py-2 font-code text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-ink shadow-[0_1px_0_rgba(20,20,20,0.18)] transition-colors hover:bg-ink hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink" href={`/organizer/events/${event.id}`}>
                Publicar <Send aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} />
              </Link>
            </div>
          ) : (
            <p className="inline-flex items-center justify-center gap-2 font-code text-[0.7rem] font-medium uppercase tracking-[0.12em] text-success">
              <Circle aria-hidden="true" className="size-3 fill-success" strokeWidth={2} /> Publicado
            </p>
          )}
          <div aria-label="Ações da sessão" className="flex flex-nowrap items-center justify-center gap-1.5 sm:justify-end sm:gap-2">
            <Link className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap bg-accent px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:px-3.5" href={`/organizer/events/${event.id}`}><Pencil aria-hidden="true" className="size-[18px]" strokeWidth={1.8} /> Editar</Link>
            {event.canChangeMovie && !event.isPast ? <Link aria-label="Trocar filme" className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap border border-rule px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:px-3.5" href={`/organizer/events/${event.id}/change-movie`}><RefreshCw aria-hidden="true" className="size-[18px]" strokeWidth={1.8} /><span className="sm:hidden">Trocar</span><span className="hidden sm:inline">Trocar filme</span></Link> : null}
            {event.canDelete ? <DeleteOrganizerDraftButton compact eventId={event.id} /> : null}
          </div>
        </footer>
      )}
    </article>
  );
}

export default async function OrganizerPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const request = new Request("http://localhost", { headers: await headers() });
  const session = await getSession(request);
  if (!session) redirect("/login");
  if (session.user.role !== "ORGANIZER") redirect(getRoleHomePath(session.user.role));

  const events = await listOrganizerEvents(session.user.id);
  const { deleted } = await searchParams;
  const groups: Array<[string, OrganizerEvent[]]> = [
    ["Rascunhos", events.filter((event) => event.status === "DRAFT")],
    ["Próximas sessões", events.filter((event) => event.status === "PUBLISHED" && !event.isPast)],
    ["Histórico", events.filter((event) => event.status === "PUBLISHED" && event.isPast)],
  ];

  return (
    <main className="min-h-screen bg-paper px-6 py-8 text-ink sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[88rem]">
        <AppHeader />
        <section className="py-12 sm:py-16"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="inline-flex bg-ink px-3 py-1.5 font-code text-[0.7rem] font-medium uppercase tracking-[0.14em] text-accent">Área do organizador</p><h1 className="mt-4 font-display text-5xl leading-[0.95] sm:text-6xl">Minhas sessões</h1><p className="mt-5 max-w-xl leading-7 text-ink-muted">Acompanhe rascunhos, próximas sessões e o histórico da programação.</p></div><Link className="inline-flex items-center justify-center gap-2 bg-accent px-5 py-3 text-center text-sm font-semibold text-ink hover:bg-accent-hover" href="/organizer/new"><span aria-hidden="true" className="text-lg leading-none">+</span> Nova sessão</Link></div></section>
        {deleted === "1" ? <p className="mb-6 border-l-4 border-success bg-surface p-4 text-sm text-success" role="status">Sessão excluída</p> : null}
        {events.length === 0 ? <section className="border-y border-rule py-16 text-center"><h2 className="font-display text-3xl">Sua programação começa aqui</h2><p className="mt-3 text-ink-muted">Busque um filme no TMDb para criar a primeira sessão.</p><Link className="mt-6 inline-block bg-accent px-5 py-3 text-sm font-semibold text-ink hover:bg-accent-hover" href="/organizer/new">Criar nova sessão</Link></section> : <section aria-label="Sessões do organizador" className="grid gap-10 pb-16">{groups.map(([label, group]) => group.length > 0 ? <div key={label}><h2 className="font-code text-xs uppercase tracking-[0.16em] text-ink-muted">{label}</h2><div className="mt-4 grid gap-4">{group.map((event) => <EventCard event={event} key={event.id} />)}</div></div> : null)}</section>}
      </div>
    </main>
  );
}

import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { DeleteOrganizerDraftButton } from "@/components/delete-organizer-draft-button";
import { getRoleHomePath, getSession } from "@/modules/auth";
import { formatCurrency, formatEventDate } from "@/modules/events/event-format";
import { listOrganizerEvents, type OrganizerEvent } from "@/modules/events";

export const dynamic = "force-dynamic";

function ActionIcon({ name }: { name: "edit" | "eye" | "swap" }) {
  const paths = {
    edit: <path d="m4 16 9.5-9.5 4 4L8 20H4v-4Zm12.3-10.3 1.1-1.1a1.9 1.9 0 0 1 2.7 2.7L19 8.4l-4-4Z" />,
    eye: <><path d="M2.5 12s3.4-5.5 9.5-5.5S21.5 12 21.5 12 18.1 17.5 12 17.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    swap: <><path d="M7 7h11m0 0-3-3m3 3-3 3M17 17H6m0 0 3 3m-3-3 3-3" /></>,
  } as const;

  return <svg aria-hidden="true" className="size-4 shrink-0 fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24">{paths[name]}</svg>;
}

function EventCard({ event }: { event: OrganizerEvent }) {
  const stateClasses = event.status === "DRAFT"
    ? "border-ink bg-ink text-accent"
    : event.isPast
      ? "border-ink-muted bg-surface-secondary text-ink"
      : "border-success bg-success/10 text-success";
  const stateLabel = event.status === "DRAFT" ? "Rascunho" : event.isPast ? "Encerrada" : "Publicada";

  return (
    <article className="grid gap-5 border border-rule bg-surface p-4 shadow-[0_1px_0_rgba(20,20,20,0.03)] sm:grid-cols-[8rem_minmax(0,1fr)] sm:p-5 lg:grid-cols-[8rem_minmax(0,1fr)_auto]">
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
        <div className="h-fit border-t border-rule pt-5 sm:col-span-2 lg:col-span-1 lg:max-w-60 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <Link className="inline-flex w-full items-center justify-center gap-2 border border-rule px-4 py-3 text-center text-sm font-semibold hover:bg-surface-secondary" href={`/organizer/events/${event.id}`}><ActionIcon name="eye" /> Ver sessão</Link>
          <p className="mt-3 text-sm leading-6 text-ink-muted">{event.hasTransactionalHistory ? "Esta sessão possui histórico de ingressos e foi preservada para consulta." : "Esta sessão não pode mais ser alterada."}</p>
        </div>
      ) : (
        <div className="flex h-fit flex-wrap items-center gap-2 border-t border-rule pt-5 sm:col-span-2 lg:col-span-1 lg:max-w-[20rem] lg:justify-end lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <Link className="inline-flex items-center justify-center gap-2 bg-accent px-4 py-3 text-center text-sm font-semibold text-ink hover:bg-accent-hover" href={`/organizer/events/${event.id}`}><ActionIcon name="edit" /> Editar</Link>
          {event.canChangeMovie && !event.isPast ? <Link className="inline-flex items-center justify-center gap-2 border border-rule px-4 py-3 text-center text-sm font-semibold hover:bg-surface-secondary" href={`/organizer/events/${event.id}/change-movie`}><ActionIcon name="swap" /> Trocar filme</Link> : null}
          {event.status === "DRAFT" ? <Link aria-label="Configurar e publicar sessão" className="inline-flex items-center justify-center gap-2 border border-ink bg-ink px-4 py-3 text-center font-code text-[0.68rem] font-medium uppercase tracking-[0.12em] text-accent hover:bg-ink/90" href={`/organizer/events/${event.id}`}><span aria-hidden="true" className="size-2 rounded-full bg-accent" /> Publicar</Link> : null}
          {event.canDelete ? <DeleteOrganizerDraftButton eventId={event.id} /> : null}
        </div>
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

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

import { formatCurrency, formatEventDate } from "@/modules/events/event-format";
import type { OrganizerEvent } from "@/modules/events/organizer-events.types";

type FormState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "publishing" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

function toDateTimeLocal(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

  return localDate.toISOString().slice(0, 16);
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "object" &&
    payload.error !== null &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return fallback;
}

export function OrganizerEventForm({
  event,
  venueSuggestions = [],
}: {
  event: OrganizerEvent;
  venueSuggestions?: string[];
}) {
  const router = useRouter();
  const [venueName, setVenueName] = useState(event.venueName ?? "");
  const [roomName, setRoomName] = useState(event.roomName ?? "");
  const [startsAt, setStartsAt] = useState(toDateTimeLocal(event.startsAt));
  const [price, setPrice] = useState(
    event.priceCents === null ? "" : (event.priceCents / 100).toFixed(2),
  );
  const [rows, setRows] = useState(event.rows?.toString() ?? "");
  const [seatsPerRow, setSeatsPerRow] = useState(event.seatsPerRow?.toString() ?? "");
  const [state, setState] = useState<FormState>({ kind: "idle" });
  const capacity = useMemo(() => Number(rows) * Number(seatsPerRow), [rows, seatsPerRow]);
  const isPublished = event.status === "PUBLISHED";

  function requestBody() {
    return {
      priceCents: Math.round(Number(price.replace(",", ".")) * 100),
      roomName,
      rows: Number(rows),
      seatsPerRow: Number(seatsPerRow),
      startsAt: startsAt ? new Date(startsAt).toISOString() : "",
      venueName,
    };
  }

  async function saveDraft(eventToSubmit: FormEvent<HTMLFormElement>) {
    eventToSubmit.preventDefault();
    setState({ kind: "saving" });

    try {
      const response = await fetch(`/api/organizer/events/${event.id}`, {
        body: JSON.stringify(requestBody()),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, "Não foi possível salvar o rascunho."));
      }

      setState({ kind: "success", message: "Rascunho salvo. Revise os dados antes de publicar." });
      router.refresh();
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "Não foi possível salvar o rascunho.",
      });
    }
  }

  async function publishEvent() {
    setState({ kind: "publishing" });

    try {
      const saveResponse = await fetch(`/api/organizer/events/${event.id}`, {
        body: JSON.stringify(requestBody()),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      });
      const savePayload: unknown = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(getErrorMessage(savePayload, "Revise os dados da sessão antes de publicar."));
      }

      const publishResponse = await fetch(`/api/organizer/events/${event.id}/publish`, {
        method: "POST",
      });
      const publishPayload: unknown = await publishResponse.json();

      if (!publishResponse.ok) {
        throw new Error(getErrorMessage(publishPayload, "Não foi possível publicar a sessão."));
      }

      setState({ kind: "success", message: "Sessão publicada e assentos gerados." });
      router.refresh();
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "Não foi possível publicar a sessão.",
      });
    }
  }

  if (isPublished) {
    return (
      <section className="py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(14rem,22rem)_minmax(0,1fr)] lg:items-start">
          <Image alt={`Pôster de ${event.movie.title}`} className="aspect-[2/3] w-full border border-rule object-cover" height={900} priority src={event.movie.posterPath} width={600} />
          <div>
            <p className="font-code text-xs uppercase tracking-[0.18em] text-success">Sessão publicada</p>
            <h1 className="mt-3 font-display text-5xl leading-[0.95] text-balance sm:text-6xl">{event.movie.title}</h1>
            <p className="mt-5 max-w-2xl leading-7 text-ink-muted">
              Esta sessão já está na programação e não pode mais ser alterada.
            </p>
            <dl className="mt-8 grid gap-px border border-rule bg-rule sm:grid-cols-2">
              <div className="bg-surface p-5"><dt className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted">Quando</dt><dd className="mt-2 font-medium">{event.startsAt ? formatEventDate(event.startsAt) : "—"}</dd></div>
              <div className="bg-surface p-5"><dt className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted">Onde</dt><dd className="mt-2 font-medium">{event.venueName} · {event.roomName}</dd></div>
              <div className="bg-surface p-5"><dt className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted">Capacidade</dt><dd className="mt-2 font-medium">{event.capacity} lugares</dd></div>
              <div className="bg-surface p-5"><dt className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted">Valor</dt><dd className="mt-2 font-medium">{event.priceCents === null ? "—" : formatCurrency(event.priceCents)}</dd></div>
            </dl>
            <Link className="mt-8 inline-block bg-accent px-5 py-3 text-sm font-semibold text-ink hover:bg-accent-hover" href="/organizer">
              Voltar para minhas sessões
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 sm:py-14">
      <p className="inline-flex bg-ink px-3 py-1.5 font-code text-[0.7rem] font-medium uppercase tracking-[0.12em] text-accent">Nova sessão · etapas 2 e 3 de 3</p>
      <h1 className="mt-3 font-display text-5xl leading-[0.95]">Configure, revise e publique</h1>
      <p className="mt-5 max-w-2xl leading-7 text-ink-muted">
        O rascunho permanece privado até a publicação. Ao publicar, os assentos serão gerados e a sessão ficará disponível na programação.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-4 border-y border-rule py-4">
        <Image alt={`Pôster atual de ${event.movie.title}`} className="h-20 w-14 border border-rule object-cover" height={120} src={event.movie.posterPath} width={80} />
        <div className="min-w-0 flex-1">
          <p className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted">Filme atual</p>
          <p className="mt-1 font-display text-2xl">{event.movie.title}</p>
        </div>
        <Link className="border border-rule px-4 py-3 text-sm font-semibold hover:bg-surface-secondary" href={`/organizer/events/${event.id}/change-movie`}>
          Trocar filme
        </Link>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form className="border border-rule bg-surface p-5 sm:p-7" onSubmit={saveDraft}>
          <h2 className="font-display text-3xl">Configuração da sessão</h2>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="text-sm font-medium">Local</span><input className="mt-2 w-full border border-rule bg-paper px-3 py-3 text-sm" list="organizer-venue-suggestions" onChange={(input) => setVenueName(input.target.value)} placeholder="Ex.: Cine Projeção" required value={venueName} />{venueSuggestions.length > 0 ? <datalist id="organizer-venue-suggestions">{venueSuggestions.map((venue) => <option key={venue} value={venue} />)}</datalist> : null}</label>
            <label><span className="text-sm font-medium">Sala</span><input className="mt-2 w-full border border-rule bg-paper px-3 py-3 text-sm" onChange={(input) => setRoomName(input.target.value)} placeholder="Ex.: Sala 2" required value={roomName} /></label>
            <label><span className="text-sm font-medium">Data e horário</span><input className="mt-2 w-full border border-rule bg-paper px-3 py-3 text-sm" onChange={(input) => setStartsAt(input.target.value)} required type="datetime-local" value={startsAt} /></label>
            <label><span className="text-sm font-medium">Preço (R$)</span><input className="mt-2 w-full border border-rule bg-paper px-3 py-3 text-sm" inputMode="decimal" min="0.01" onChange={(input) => setPrice(input.target.value)} placeholder="Ex.: 30,00" required step="0.01" type="number" value={price} /></label>
            <label><span className="text-sm font-medium">Fileiras</span><input className="mt-2 w-full border border-rule bg-paper px-3 py-3 text-sm" max="20" min="1" onChange={(input) => setRows(input.target.value)} placeholder="Ex.: 5" required type="number" value={rows} /></label>
            <label><span className="text-sm font-medium">Assentos por fileira</span><input className="mt-2 w-full border border-rule bg-paper px-3 py-3 text-sm" max="30" min="1" onChange={(input) => setSeatsPerRow(input.target.value)} placeholder="Ex.: 10" required type="number" value={seatsPerRow} /></label>
          </div>
          <p className="mt-5 text-sm text-ink-muted">Capacidade prevista: {Number.isFinite(capacity) && capacity > 0 ? `${capacity} lugares` : "informe as dimensões da sala"}. Máximo de 600 lugares.</p>
          <button className="mt-7 border border-rule px-5 py-3 text-sm font-semibold hover:bg-surface-secondary disabled:opacity-60" disabled={state.kind === "saving" || state.kind === "publishing"} type="submit">
            {state.kind === "saving" ? "Salvando…" : "Salvar rascunho"}
          </button>
        </form>

        <aside className="h-fit border border-rule bg-surface-secondary p-5 sm:p-6">
          <p className="font-code text-xs uppercase tracking-[0.18em] text-ink-muted">Revisão</p>
          <Image alt={`Pôster de ${event.movie.title}`} className="mt-5 aspect-[2/3] w-full border border-rule object-cover" height={600} src={event.movie.posterPath} width={400} />
          <h2 className="mt-5 font-display text-3xl leading-tight">{event.movie.title}</h2>
          <dl className="mt-6 space-y-4 border-y border-rule py-5 text-sm">
            <div><dt className="text-ink-muted">Sessão</dt><dd className="mt-1 font-medium">{startsAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(startsAt)) : "Defina a data e o horário"}</dd></div>
            <div><dt className="text-ink-muted">Local</dt><dd className="mt-1 font-medium">{venueName || "Defina o local"} · {roomName || "sala"}</dd></div>
            <div><dt className="text-ink-muted">Preço</dt><dd className="mt-1 font-medium">{Number(price.replace(",", ".")) > 0 ? formatCurrency(Math.round(Number(price.replace(",", ".")) * 100)) : "Defina o preço"}</dd></div>
          </dl>
          <button className="mt-6 w-full bg-accent px-4 py-3 text-sm font-semibold text-ink hover:bg-accent-hover disabled:opacity-60" disabled={state.kind === "saving" || state.kind === "publishing"} onClick={publishEvent} type="button">
            {state.kind === "publishing" ? "Publicando…" : "Publicar sessão"}
          </button>
          <p className="mt-4 text-xs leading-5 text-ink-muted">A publicação torna a sessão visível para o público e bloqueia novas alterações.</p>
        </aside>
      </div>

      {state.kind === "error" ? <p className="mt-6 border-l-4 border-error bg-surface p-4 text-sm text-error" role="alert">{state.message}</p> : null}
      {state.kind === "success" ? <p className="mt-6 border-l-4 border-success bg-surface p-4 text-sm text-success" role="status">{state.message}</p> : null}
    </section>
  );
}

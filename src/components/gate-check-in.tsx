"use client";

import { type FormEvent, useState } from "react";

import { QrCameraScanner } from "@/components/qr-camera-scanner";
import type { CheckInResult } from "@/modules/check-in";
import { formatEventDate } from "@/modules/events/event-format";
import type { PublishedEventSummary } from "@/modules/events";

type GateEvent = PublishedEventSummary & {
  gateState: "ACTIVE" | "EXPIRED" | "NOT_STARTED";
};
type GateCheckInProps = { events: GateEvent[] };
type SubmissionState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "result"; value: CheckInResult }
  | { kind: "error"; message: string };

const resultAppearance = {
  ALREADY_USED: { border: "border-gate-used", icon: "◷", label: "JÁ UTILIZADO", text: "text-gate-used", title: "Entrada já registrada" },
  INVALID: { border: "border-gate-invalid", icon: "×", label: "INVÁLIDO", text: "text-gate-invalid", title: "Credencial não reconhecida" },
  VALID: { border: "border-gate-valid", icon: "✓", label: "VÁLIDO", text: "text-gate-valid", title: "Acesso liberado" },
  WRONG_EVENT: { border: "border-gate-wrong-event", icon: "!", label: "SESSÃO INCORRETA", text: "text-gate-wrong-event", title: "Ingresso de outra sessão" },
} as const;

function ValidationResult({ onReset, value }: { onReset: () => void; value: CheckInResult }) {
  const appearance = resultAppearance[value.result];

  return (
    <section aria-live="assertive" className={`border-2 ${appearance.border} bg-gate-surface-raised p-7 sm:p-10`} role="status">
      <div className="text-center">
        <div aria-hidden="true" className={`mx-auto flex size-20 items-center justify-center rounded-full border-2 ${appearance.border} font-code text-5xl ${appearance.text}`}>{appearance.icon}</div>
        <p className={`mt-7 font-code text-sm font-medium tracking-[0.18em] ${appearance.text}`}>{appearance.label}</p>
        <h2 className="mt-3 font-display text-4xl leading-none sm:text-5xl">{appearance.title}</h2>
      </div>
      {value.result === "VALID" ? <dl className="mt-8 grid gap-5 border-y border-gate-border py-6 sm:grid-cols-2"><div><dt className="font-code text-xs uppercase tracking-[0.12em] text-gate-muted">Filme · titular</dt><dd className="mt-2 font-medium">{value.ticket.eventTitle}</dd><dd className="mt-1 text-sm text-gate-muted">{value.ticket.holderName}</dd></div><div><dt className="font-code text-xs uppercase tracking-[0.12em] text-gate-muted">Assento</dt><dd className="mt-2 font-display text-4xl">{value.ticket.seatLabel}</dd></div></dl> : null}
      {value.result === "ALREADY_USED" ? <p className="mt-7 text-gate-muted">Primeiro uso registrado em {formatEventDate(value.usedAt)}. Não libere uma nova entrada para esta credencial.</p> : null}
      {value.result === "WRONG_EVENT" ? <p className="mt-7 text-gate-muted">Este ingresso pertence a “{value.ticketEvent.title}”. Ele não foi consumido nesta tentativa.</p> : null}
      {value.result === "INVALID" ? <p className="mt-7 text-gate-muted">Confira o QR ou o código e tente novamente. Nenhum ingresso foi alterado.</p> : null}
      <button className={`mt-9 w-full border-2 ${appearance.border} px-5 py-4 font-semibold ${appearance.text} hover:bg-white/5`} onClick={onReset} type="button">Validar próximo ingresso</button>
    </section>
  );
}

export function GateCheckIn({ events }: GateCheckInProps) {
  const [state, setState] = useState<SubmissionState>({ kind: "idle" });
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const selectedEvent = events.find((event) => event.id === eventId);
  const sessionMessage = selectedEvent?.gateState === "NOT_STARTED"
    ? { title: "Sessão futura", body: "A validação de ingressos continua disponível para esta sessão." }
    : selectedEvent?.gateState === "EXPIRED"
      ? { title: "Sessão encerrada", body: "A validação de ingressos continua disponível para esta sessão." }
      : null;

  async function submitCredential(endpoint: "/api/check-in/manual" | "/api/check-in/qr", credential: Record<string, string>) {
    setState({ kind: "submitting" });
    const response = await fetch(endpoint, { body: JSON.stringify({ ...credential, eventId }), headers: { "content-type": "application/json" }, method: "POST" });
    const payload = (await response.json()) as CheckInResult & { error?: { message?: string } };

    if (!response.ok) {
      setState({ kind: "error", message: payload.error?.message ?? "Não foi possível validar o ingresso." });
      return;
    }

    setState({ kind: "result", value: payload });
  }

  async function submitManualCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const code = new FormData(form).get("code");

    await submitCredential("/api/check-in/manual", { code: String(code ?? "") });
    form.reset();
  }

  if (state.kind === "result") return <ValidationResult onReset={() => setState({ kind: "idle" })} value={state.value} />;

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
      <div>
        <label className="block border border-gate-border bg-gate-surface p-5 text-sm font-medium sm:p-6"><span>Sessão em validação</span><select className="mt-3 w-full border border-gate-border bg-gate-bg px-4 py-4 text-gate-text" disabled={events.length === 0 || state.kind === "submitting"} onChange={(event) => setEventId(event.target.value)} value={eventId}>{events.map((event) => <option key={event.id} value={event.id}>{event.movie.title} · {event.roomName} · {formatEventDate(event.startsAt)}</option>)}</select></label>
        {sessionMessage ? <section className="mt-6 border border-gate-border bg-gate-surface p-6 text-center"><p className="font-code text-xs uppercase tracking-[0.16em] text-gate-used">{sessionMessage.title}</p><p className="mt-3 text-sm leading-6 text-gate-muted">{sessionMessage.body}</p></section> : null}
        {events.length === 0 ? <p className="mt-6 border border-gate-border bg-gate-surface p-5 text-gate-muted">Não há sessões publicadas disponíveis para validação.</p> : <div className="mt-6"><QrCameraScanner disabled={state.kind === "submitting"} onToken={(token) => submitCredential("/api/check-in/qr", { token })} /></div>}
      </div>
      <section className="border border-gate-border bg-gate-surface p-6 sm:p-8" aria-labelledby="manual-title">
        <p className="font-code text-xs uppercase tracking-[0.16em] text-gate-valid">Alternativa manual</p>
        <h1 className="mt-3 font-display text-4xl leading-none sm:text-5xl" id="manual-title">Digitar código</h1>
        <p className="mt-4 text-sm leading-6 text-gate-muted">A leitura manual está sempre disponível quando a câmera não puder ser usada.</p>
        <form className="mt-8 grid gap-6" onSubmit={submitManualCode}>
          <label><span className="text-sm font-medium">Código manual do ingresso</span><input autoComplete="off" autoFocus className="mt-2 w-full border border-gate-border bg-gate-bg px-4 py-4 font-code text-lg uppercase tracking-[0.12em] text-gate-text placeholder:text-gate-muted" disabled={events.length === 0 || state.kind === "submitting"} inputMode="text" maxLength={20} name="code" placeholder="K7PX-4M2Q-W9DN" required spellCheck={false} /></label>
          {state.kind === "error" ? <p className="border-l-4 border-gate-invalid bg-gate-bg p-4 text-gate-invalid" role="alert">{state.message}</p> : null}
          <button className="bg-gate-valid px-5 py-4 font-semibold text-gate-bg hover:brightness-110 disabled:cursor-wait disabled:opacity-60" disabled={events.length === 0 || state.kind === "submitting"} type="submit">{state.kind === "submitting" ? "Validando…" : "Validar ingresso"}</button>
        </form>
      </section>
    </section>
  );
}

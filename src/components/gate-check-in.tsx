"use client";

import { type FormEvent, useState } from "react";

import type { PublishedEventSummary } from "@/modules/events";
import type { CheckInResult } from "@/modules/check-in";
import { formatEventDate } from "@/modules/events/event-format";

type GateCheckInProps = {
  events: PublishedEventSummary[];
};

type SubmissionState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "result"; value: CheckInResult }
  | { kind: "error"; message: string };

const resultAppearance = {
  ALREADY_USED: {
    border: "border-gate-used",
    icon: "◷",
    label: "JÁ UTILIZADO",
    text: "text-gate-used",
    title: "Entrada já registrada",
  },
  INVALID: {
    border: "border-gate-invalid",
    icon: "×",
    label: "INVÁLIDO",
    text: "text-gate-invalid",
    title: "Credencial não reconhecida",
  },
  VALID: {
    border: "border-gate-valid",
    icon: "✓",
    label: "VÁLIDO",
    text: "text-gate-valid",
    title: "Acesso liberado",
  },
  WRONG_EVENT: {
    border: "border-gate-wrong-event",
    icon: "!",
    label: "SESSÃO INCORRETA",
    text: "text-gate-wrong-event",
    title: "Ingresso de outra sessão",
  },
} as const;

function ValidationResult({
  onReset,
  value,
}: {
  onReset: () => void;
  value: CheckInResult;
}) {
  const appearance = resultAppearance[value.result];

  return (
    <section
      aria-live="assertive"
      className={`border-2 ${appearance.border} bg-gate-surface-raised p-7 sm:p-10`}
      role="status"
    >
      <div
        aria-hidden="true"
        className={`flex size-20 items-center justify-center rounded-full border-2 ${appearance.border} font-code text-5xl ${appearance.text}`}
      >
        {appearance.icon}
      </div>
      <p className={`mt-7 font-code text-sm font-medium tracking-[0.18em] ${appearance.text}`}>
        {appearance.label}
      </p>
      <h2 className="mt-3 font-display text-4xl leading-none sm:text-5xl">
        {appearance.title}
      </h2>

      {value.result === "VALID" ? (
        <dl className="mt-8 grid gap-5 border-y border-gate-border py-6 sm:grid-cols-2">
          <div>
            <dt className="font-code text-xs uppercase tracking-[0.12em] text-gate-muted">
              Filme · titular
            </dt>
            <dd className="mt-2 font-medium">{value.ticket.eventTitle}</dd>
            <dd className="mt-1 text-sm text-gate-muted">{value.ticket.holderName}</dd>
          </div>
          <div>
            <dt className="font-code text-xs uppercase tracking-[0.12em] text-gate-muted">
              Assento
            </dt>
            <dd className="mt-2 font-display text-4xl">{value.ticket.seatLabel}</dd>
          </div>
        </dl>
      ) : null}

      {value.result === "ALREADY_USED" ? (
        <p className="mt-7 text-gate-muted">
          Primeiro uso registrado em {formatEventDate(value.usedAt)}. Não libere
          uma nova entrada para esta credencial.
        </p>
      ) : null}

      {value.result === "WRONG_EVENT" ? (
        <p className="mt-7 text-gate-muted">
          Este ingresso pertence a “{value.ticketEvent.title}”. Ele não foi
          consumido nesta tentativa.
        </p>
      ) : null}

      {value.result === "INVALID" ? (
        <p className="mt-7 text-gate-muted">
          Confira o código e tente novamente. Nenhum ingresso foi alterado.
        </p>
      ) : null}

      <button
        className={`mt-9 w-full border-2 ${appearance.border} px-5 py-4 font-semibold ${appearance.text} hover:bg-white/5`}
        onClick={onReset}
        type="button"
      >
        Validar próximo ingresso
      </button>
    </section>
  );
}

export function GateCheckIn({ events }: GateCheckInProps) {
  const [state, setState] = useState<SubmissionState>({ kind: "idle" });

  async function submitManualCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ kind: "submitting" });

    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/check-in/manual", {
      body: JSON.stringify({
        code: formData.get("code"),
        eventId: formData.get("eventId"),
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const payload = (await response.json()) as CheckInResult & {
      error?: { message?: string };
    };

    if (!response.ok) {
      setState({
        kind: "error",
        message: payload.error?.message ?? "Não foi possível validar o ingresso.",
      });
      return;
    }

    form.reset();
    setState({ kind: "result", value: payload });
  }

  if (state.kind === "result") {
    return (
      <ValidationResult
        onReset={() => setState({ kind: "idle" })}
        value={state.value}
      />
    );
  }

  return (
    <section className="border border-gate-border bg-gate-surface p-6 sm:p-8">
      <p className="font-code text-xs uppercase tracking-[0.16em] text-gate-valid">
        Validação manual
      </p>
      <h1 className="mt-3 font-display text-4xl leading-none sm:text-5xl">
        Conferir ingresso
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-gate-muted">
        Selecione a sessão e digite o código impresso abaixo do QR. A câmera será
        adicionada em uma etapa posterior.
      </p>

      {events.length === 0 ? (
        <p className="mt-8 border border-gate-border bg-gate-bg p-5 text-gate-muted">
          Não há sessões publicadas disponíveis para validação.
        </p>
      ) : (
        <form className="mt-8 grid gap-6" onSubmit={submitManualCode}>
          <label>
            <span className="text-sm font-medium">Sessão em validação</span>
            <select
              className="mt-2 w-full border border-gate-border bg-gate-bg px-4 py-4 text-gate-text"
              name="eventId"
              required
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.movie.title} · {event.roomName} · {formatEventDate(event.startsAt)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-sm font-medium">Código manual do ingresso</span>
            <input
              autoComplete="off"
              autoFocus
              className="mt-2 w-full border border-gate-border bg-gate-bg px-4 py-4 font-code text-lg uppercase tracking-[0.12em] text-gate-text placeholder:text-gate-muted"
              inputMode="text"
              maxLength={20}
              name="code"
              placeholder="K7PX-4M2Q-W9DN"
              required
              spellCheck={false}
            />
          </label>

          {state.kind === "error" ? (
            <p className="border-l-4 border-gate-invalid bg-gate-bg p-4 text-gate-invalid" role="alert">
              {state.message}
            </p>
          ) : null}

          <button
            className="bg-gate-valid px-5 py-4 font-semibold text-gate-bg hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
            disabled={state.kind === "submitting"}
            type="submit"
          >
            {state.kind === "submitting" ? "Validando…" : "Validar ingresso"}
          </button>
        </form>
      )}
    </section>
  );
}

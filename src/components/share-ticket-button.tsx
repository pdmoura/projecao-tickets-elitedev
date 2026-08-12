"use client";

import { useState } from "react";

type ShareState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; url: string }
  | { kind: "error"; message: string };

function getErrorMessage(payload: unknown): string {
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

  return "Não foi possível gerar o link de compartilhamento.";
}

export function ShareTicketButton({ ticketId }: { ticketId: string }) {
  const [state, setState] = useState<ShareState>({ kind: "idle" });

  async function createShareLink() {
    setState({ kind: "loading" });

    try {
      const response = await fetch(`/api/tickets/${ticketId}/share`, { method: "POST" });
      const payload: unknown = await response.json();

      if (
        !response.ok ||
        typeof payload !== "object" ||
        payload === null ||
        !("url" in payload) ||
        typeof payload.url !== "string"
      ) {
        throw new Error(getErrorMessage(payload));
      }

      setState({ kind: "success", url: payload.url });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "Não foi possível gerar o link de compartilhamento.",
      });
    }
  }

  return (
    <div className="mt-8 border-t border-rule pt-6">
      <button className="w-full border border-ink px-5 py-3 text-sm font-semibold text-ink hover:bg-surface-secondary disabled:opacity-60" disabled={state.kind === "loading"} onClick={createShareLink} type="button">
        {state.kind === "loading" ? "Gerando link…" : "Compartilhar ingresso"}
      </button>
      <p className="mt-3 text-xs leading-5 text-ink-muted">O link permite apenas visualizar este ingresso. A propriedade continua com você.</p>
      {state.kind === "success" ? (
        <div className="mt-4 border-l-4 border-success bg-paper p-4" role="status">
          <p className="text-sm font-semibold text-success">Link de compartilhamento gerado</p>
          <label className="mt-3 block text-xs text-ink-muted" htmlFor="share-url">Copie o link. Gerar outro link invalida o anterior.</label>
          <input className="mt-2 w-full border border-rule bg-surface px-3 py-2 font-code text-xs" id="share-url" readOnly value={state.url} />
        </div>
      ) : null}
      {state.kind === "error" ? <p className="mt-4 border-l-4 border-error bg-paper p-4 text-sm text-error" role="alert">{state.message}</p> : null}
    </div>
  );
}

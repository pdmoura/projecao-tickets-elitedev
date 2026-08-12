"use client";

import { useRef, useState } from "react";

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
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const shareUrlRef = useRef<HTMLInputElement>(null);

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

  async function copyShareLink(url: string) {
    setCopyStatus(null);

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard indisponível");
      }

      await navigator.clipboard.writeText(url);
      setCopyStatus("Link copiado");
    } catch {
      shareUrlRef.current?.select();
      setCopyStatus("Selecione e copie o link exibido.");
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
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input className="min-w-0 flex-1 break-all border border-rule bg-surface px-3 py-3 font-code text-xs" id="share-url" readOnly ref={shareUrlRef} value={state.url} />
            <button className="shrink-0 border border-ink px-4 py-3 text-sm font-semibold hover:bg-surface-secondary" onClick={() => copyShareLink(state.url)} type="button">Copiar link</button>
          </div>
          <p aria-live="polite" className="mt-2 text-sm text-success" role="status">{copyStatus}</p>
        </div>
      ) : null}
      {state.kind === "error" ? <p className="mt-4 border-l-4 border-error bg-paper p-4 text-sm text-error" role="alert">{state.message}</p> : null}
    </div>
  );
}

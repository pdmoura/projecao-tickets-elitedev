"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

type CheckoutFormProps = {
  eventId: string;
  seatIds: string[];
};

type CheckoutState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; reservationId: string }
  | { kind: "error"; code: string; message: string };

export function CheckoutForm({ eventId, seatIds }: CheckoutFormProps) {
  const [state, setState] = useState<CheckoutState>({ kind: "idle" });

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ kind: "submitting" });

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/checkout", {
      body: JSON.stringify({
        eventId,
        payment: {
          cardNumber: formData.get("cardNumber"),
          cvv: formData.get("cvv"),
          expiry: formData.get("expiry"),
          method: "SIMULATED_CARD",
        },
        seatIds,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const payload = (await response.json()) as {
      error?: { code?: string; message?: string };
      reservationId?: string;
    };

    if (response.ok && payload.reservationId) {
      setState({ kind: "success", reservationId: payload.reservationId });
      return;
    }

    setState({
      code: payload.error?.code ?? "INTERNAL_ERROR",
      kind: "error",
      message: payload.error?.message ?? "Não foi possível concluir a compra.",
    });
  }

  if (state.kind === "success") {
    return (
      <section className="mt-8 border border-success bg-surface p-5" role="status">
        <p className="font-semibold text-success">Compra confirmada</p>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Sua reserva foi criada e os ingressos foram emitidos. Cada assento tem
          uma credencial individual para entrada.
        </p>
        <p className="mt-3 font-code text-xs text-ink-muted">
          Reserva {state.reservationId}
        </p>
        <Link
          className="mt-5 inline-block bg-success px-5 py-3 font-semibold text-white"
          href="/tickets"
        >
          Ver meus ingressos
        </Link>
      </section>
    );
  }

  return (
    <form className="mt-8 border border-rule bg-surface p-5" onSubmit={submitCheckout}>
      <h2 className="font-display text-3xl">Pagamento de teste</h2>
      <p className="mt-3 text-sm leading-6 text-ink-muted">
        Use <span className="font-code">4242 4242 4242 4242</span> para aprovar
        ou <span className="font-code">4000 0000 0000 0002</span> para recusar.
      </p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="text-sm font-medium">Número do cartão</span>
          <input
            autoComplete="cc-number"
            className="mt-2 w-full border border-rule bg-paper px-3 py-3 text-sm"
            inputMode="numeric"
            name="cardNumber"
            placeholder="4242 4242 4242 4242"
            required
          />
        </label>
        <label>
          <span className="text-sm font-medium">Validade</span>
          <input
            autoComplete="cc-exp"
            className="mt-2 w-full border border-rule bg-paper px-3 py-3 text-sm"
            inputMode="numeric"
            name="expiry"
            placeholder="12/30"
            required
          />
        </label>
        <label>
          <span className="text-sm font-medium">CVV</span>
          <input
            autoComplete="cc-csc"
            className="mt-2 w-full border border-rule bg-paper px-3 py-3 text-sm"
            inputMode="numeric"
            name="cvv"
            placeholder="123"
            required
            type="password"
          />
        </label>
      </div>
      {state.kind === "error" ? (
        <div className="mt-5 border-l-4 border-error bg-paper p-4" role="alert">
          <p className="font-semibold text-error">{state.message}</p>
          {state.code === "AUTH_REQUIRED" ? (
            <Link className="mt-2 inline-block text-sm underline" href="/login">
              Entrar para continuar
            </Link>
          ) : null}
          {state.code === "SEAT_UNAVAILABLE" ? (
            <Link
              className="mt-2 inline-block text-sm underline"
              href={`/events/${eventId}`}
            >
              Escolher outros assentos
            </Link>
          ) : null}
        </div>
      ) : null}
      <button
        className="mt-6 w-full bg-accent px-4 py-3 font-semibold text-ink hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60"
        disabled={state.kind === "submitting"}
        type="submit"
      >
        {state.kind === "submitting" ? "Processando…" : "Concluir compra"}
      </button>
      <p className="mt-4 text-xs leading-5 text-ink-muted">
        Os dados do cartão são usados somente para esta simulação e não são
        armazenados.
      </p>
    </form>
  );
}

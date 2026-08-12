"use client";

import Link from "next/link";
import { type FormEvent, useRef, useState } from "react";

import { AvailabilityToast } from "@/components/availability-toast";
import { formatCardExpiry } from "@/modules/checkout/expiry-format";
import {
  formatSeatsUnavailableMessage,
  resolveUnavailableSeatLabels,
} from "@/modules/seats/seat-messages";

import {
  digitsOnly,
  formatCardNumber,
  type CheckoutFieldErrors,
  validateCheckoutFields,
} from "./checkout-input-format";

type CheckoutFormProps = {
  eventId: string;
  seats: Array<{ id: string; label: string }>;
};

type CheckoutState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; reservationId: string }
  | { kind: "error"; code: string; message: string };

type CheckoutError = {
  code?: string;
  details?: { seatIds?: string[]; seatLabels?: string[] };
  message?: string;
};

export function CheckoutForm({ eventId, seats }: CheckoutFormProps) {
  const [state, setState] = useState<CheckoutState>({ kind: "idle" });
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [seatConflictMessage, setSeatConflictMessage] = useState<string | null>(
    null,
  );
  const cardNumberRef = useRef<HTMLInputElement>(null);
  const expiryRef = useRef<HTMLInputElement>(null);
  const cvvRef = useRef<HTMLInputElement>(null);
  const seatIds = seats.map((seat) => seat.id);

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateCheckoutFields({ cardNumber, cvv, expiry });
    setFieldErrors(errors);

    if (errors.cardNumber || errors.expiry || errors.cvv) {
      (errors.cardNumber ? cardNumberRef : errors.expiry ? expiryRef : cvvRef).current?.focus();
      return;
    }

    setState({ kind: "submitting" });
    setSeatConflictMessage(null);

    const response = await fetch("/api/checkout", {
      body: JSON.stringify({
        eventId,
        payment: {
          cardNumber: digitsOnly(cardNumber, 16),
          cvv,
          expiry,
          method: "SIMULATED_CARD",
        },
        seatIds,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const payload = (await response.json()) as {
      error?: CheckoutError;
      reservationId?: string;
    };

    if (response.ok && payload.reservationId) {
      setState({ kind: "success", reservationId: payload.reservationId });
      return;
    }

    const error = payload.error;
    const code = error?.code ?? "INTERNAL_ERROR";

    if (code === "SEAT_UNAVAILABLE") {
      const labels = resolveUnavailableSeatLabels({
        seatIds: error?.details?.seatIds ?? [],
        seatLabels: error?.details?.seatLabels ?? [],
        seats,
      });

      setSeatConflictMessage(formatSeatsUnavailableMessage(labels));
    }

    setState({
      code,
      kind: "error",
      message:
        code === "PAYMENT_DECLINED"
          ? "O pagamento de teste foi recusado. Use outro cartão para continuar."
          : error?.message ?? "Não foi possível concluir a compra.",
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
    <>
      <form className="border border-rule bg-surface p-5 sm:p-7" noValidate onSubmit={submitCheckout}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl">Pagamento de teste</h2>
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              Use <span className="font-code">4242 4242 4242 4242</span> para aprovar
              ou <span className="font-code">4000 0000 0000 0002</span> para recusar.
            </p>
          </div>
          <Link
            className="shrink-0 text-sm underline decoration-accent decoration-2 underline-offset-4"
            href={`/events/${eventId}`}
          >
            Voltar para escolher assentos
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-sm font-medium">Número do cartão</span>
            <input
              autoComplete="cc-number"
              aria-describedby={fieldErrors.cardNumber ? "card-number-error" : undefined}
              aria-invalid={Boolean(fieldErrors.cardNumber)}
              className="mt-2 w-full border border-rule bg-paper px-3 py-3 text-sm aria-invalid:border-error"
              inputMode="numeric"
              maxLength={19}
              name="cardNumber"
              onChange={(input) => setCardNumber(formatCardNumber(input.target.value))}
              placeholder="4242 4242 4242 4242"
              ref={cardNumberRef}
              value={cardNumber}
            />
            {fieldErrors.cardNumber ? <p className="mt-2 text-sm text-error" id="card-number-error">{fieldErrors.cardNumber}</p> : null}
          </label>
          <label>
            <span className="text-sm font-medium">Validade</span>
            <input
              autoComplete="cc-exp"
              aria-describedby={fieldErrors.expiry ? "expiry-error" : undefined}
              aria-invalid={Boolean(fieldErrors.expiry)}
              className="mt-2 w-full border border-rule bg-paper px-3 py-3 text-sm aria-invalid:border-error"
              inputMode="numeric"
              maxLength={5}
              name="expiry"
              onChange={(input) => setExpiry(formatCardExpiry(input.target.value))}
              placeholder="12/30"
              ref={expiryRef}
              value={expiry}
            />
            {fieldErrors.expiry ? <p className="mt-2 text-sm text-error" id="expiry-error">{fieldErrors.expiry}</p> : null}
          </label>
          <label>
            <span className="text-sm font-medium">CVV</span>
            <input
              autoComplete="cc-csc"
              aria-describedby={fieldErrors.cvv ? "cvv-error" : undefined}
              aria-invalid={Boolean(fieldErrors.cvv)}
              className="mt-2 w-full border border-rule bg-paper px-3 py-3 text-sm aria-invalid:border-error"
              inputMode="numeric"
              maxLength={3}
              name="cvv"
              onChange={(input) => setCvv(digitsOnly(input.target.value, 3))}
              placeholder="123"
              ref={cvvRef}
              type="password"
              value={cvv}
            />
            {fieldErrors.cvv ? <p className="mt-2 text-sm text-error" id="cvv-error">{fieldErrors.cvv}</p> : null}
          </label>
        </div>
        {state.kind === "error" && state.code !== "SEAT_UNAVAILABLE" ? (
          <div className="mt-5 border-l-4 border-error bg-paper p-4" role="alert">
            <p className="font-semibold text-error">{state.message}</p>
            {state.code === "AUTH_REQUIRED" ? (
              <Link className="mt-2 inline-block text-sm underline" href="/login">
                Entrar para continuar
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

      {seatConflictMessage ? (
        <AvailabilityToast
          action={
            <Link
              className="inline-block bg-accent px-4 py-3 text-sm font-semibold text-ink hover:bg-accent-hover"
              href={`/events/${eventId}?seatConflict=1`}
            >
              Escolher outros assentos
            </Link>
          }
          message={seatConflictMessage}
          onClose={() => setSeatConflictMessage(null)}
        />
      ) : null}
    </>
  );
}

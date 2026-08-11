"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { formatCurrency } from "@/modules/events/event-format";
import { toggleSeatSelection } from "@/modules/seats/seat-selection";
import type { EventSeat } from "@/modules/seats/seats.types";

type SeatMapProps = {
  eventId: string;
  priceCents: number;
  seats: EventSeat[];
};

function getCheckoutHref(eventId: string, seatIds: readonly string[]): string {
  const searchParams = new URLSearchParams({ eventId });

  for (const seatId of seatIds) {
    searchParams.append("seatId", seatId);
  }

  return `/checkout?${searchParams.toString()}`;
}

export function SeatMap({ eventId, priceCents, seats }: SeatMapProps) {
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const rows = useMemo(
    () =>
      Array.from(new Set(seats.map((seat) => seat.rowLabel))).map((rowLabel) => ({
        rowLabel,
        seats: seats.filter((seat) => seat.rowLabel === rowLabel),
      })),
    [seats],
  );
  const selectedSeats = seats.filter((seat) => selectedSeatIds.includes(seat.id));
  const totalCents = selectedSeats.length * priceCents;

  return (
    <section aria-labelledby="seat-map-title" className="mt-12 border-t border-rule pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-code text-xs uppercase tracking-[0.18em] text-accent">
            Escolha seu lugar
          </p>
          <h2 id="seat-map-title" className="mt-2 font-display text-3xl">
            Mapa de assentos
          </h2>
        </div>
        <p className="text-sm text-ink-muted">
          {formatCurrency(priceCents)} por ingresso
        </p>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="overflow-x-auto border border-rule bg-surface p-4 sm:p-6">
          <p className="border-b-4 border-ink pb-2 text-center font-code text-xs font-semibold uppercase tracking-[0.22em] text-ink-muted">
            Tela
          </p>
          <div aria-label="Mapa de assentos" className="mx-auto mt-8 min-w-96 space-y-3">
            {rows.map((row) => (
              <div
                className="grid items-center gap-2"
                key={row.rowLabel}
                style={{
                  gridTemplateColumns: `1.75rem repeat(${row.seats.length}, minmax(2.5rem, 1fr))`,
                }}
              >
                <span aria-hidden="true" className="font-code text-sm text-ink-muted">
                  {row.rowLabel}
                </span>
                {row.seats.map((seat) => {
                  const isSelected = selectedSeatIds.includes(seat.id);
                  const isSold = seat.status === "SOLD";
                  const stateLabel = isSold
                    ? "vendido"
                    : isSelected
                      ? "selecionado"
                      : "disponível";

                  return (
                    <button
                      aria-label={`Assento ${seat.label}, ${stateLabel}`}
                      aria-pressed={isSelected}
                      className={
                        isSold
                          ? "min-h-10 cursor-not-allowed border border-ink bg-ink px-2 font-code text-xs text-paper opacity-90"
                          : isSelected
                            ? "min-h-10 border-2 border-ink bg-accent px-2 font-code text-xs font-semibold text-ink"
                            : "min-h-10 border border-rule bg-surface-secondary px-2 font-code text-xs text-ink transition-colors hover:border-ink"
                      }
                      disabled={isSold}
                      key={seat.id}
                      onClick={() => {
                        setSelectedSeatIds((current) =>
                          toggleSeatSelection(current, seat),
                        );
                      }}
                      type="button"
                    >
                      {seat.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-muted">
            <li>□ Disponível</li>
            <li>▣ Selecionado</li>
            <li>■ Vendido</li>
          </ul>
        </div>

        <aside aria-live="polite" className="h-fit border border-rule bg-surface p-5">
          <p className="font-code text-xs uppercase tracking-[0.18em] text-ink-muted">
            Sua seleção
          </p>
          <p className="mt-4 text-sm text-ink-muted">
            {selectedSeats.length === 0
              ? "Nenhum assento selecionado."
              : selectedSeats.map((seat) => seat.label).join(", ")}
          </p>
          <dl className="mt-6 space-y-3 border-y border-rule py-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Ingressos</dt>
              <dd className="font-medium">{selectedSeats.length}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Total</dt>
              <dd className="font-semibold">{formatCurrency(totalCents)}</dd>
            </div>
          </dl>
          {selectedSeats.length > 0 ? (
            <Link
              className="mt-5 block bg-accent px-4 py-3 text-center text-sm font-semibold text-ink transition-colors hover:bg-accent-hover"
              href={getCheckoutHref(eventId, selectedSeatIds)}
            >
              Continuar para checkout
            </Link>
          ) : (
            <button
              className="mt-5 w-full cursor-not-allowed border border-rule bg-surface-secondary px-4 py-3 text-sm text-ink-muted"
              disabled
              type="button"
            >
              Selecione um assento
            </button>
          )}
          <p className="mt-4 text-xs leading-5 text-ink-muted">
            A disponibilidade será confirmada apenas ao concluir a compra. Esta
            seleção não reserva assentos.
          </p>
        </aside>
      </div>
    </section>
  );
}

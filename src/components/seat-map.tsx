"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { formatCurrency } from "@/modules/events/event-format";
import {
  mergeSeatAvailability,
  toggleSeatSelection,
} from "@/modules/seats/seat-selection";
import {
  createSeatPollingController,
  type SeatPollingController,
} from "@/modules/seats/seat-polling";
import type { EventSeat } from "@/modules/seats/seats.types";

type SeatMapProps = {
  eventId: string;
  initialSeatConflict?: boolean;
  priceCents: number;
  seats: EventSeat[];
};

const pollingIntervalMs = 7_000;

function getCheckoutHref(eventId: string, seatIds: readonly string[]): string {
  const searchParams = new URLSearchParams({ eventId });

  for (const seatId of seatIds) {
    searchParams.append("seatId", seatId);
  }

  return `/checkout?${searchParams.toString()}`;
}

export function SeatMap({
  eventId,
  initialSeatConflict = false,
  priceCents,
  seats: initialSeats,
}: SeatMapProps) {
  const [seats, setSeats] = useState(initialSeats);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(
    initialSeatConflict
      ? "A disponibilidade foi atualizada após o conflito de compra. Escolha seus assentos novamente."
      : null,
  );
  const seatsRef = useRef(initialSeats);
  const selectedSeatIdsRef = useRef<string[]>([]);
  const pollingControllerRef = useRef<SeatPollingController | null>(null);

  const applyRemoteSeats = useCallback((remoteSeats: EventSeat[]) => {
    const merged = mergeSeatAvailability(
      seatsRef.current,
      selectedSeatIdsRef.current,
      remoteSeats,
    );

    seatsRef.current = merged.seats;
    selectedSeatIdsRef.current = merged.selectedSeatIds;
    setSeats(merged.seats);
    setSelectedSeatIds(merged.selectedSeatIds);

    if (merged.unavailableSeatLabels.length > 0) {
      const labels = merged.unavailableSeatLabels.join(", ");
      setNotice(
        `O assento ${labels} foi comprado por outro cliente e removido da sua seleção.`,
      );
    }
  }, []);

  const stopPolling = useCallback(() => {
    pollingControllerRef.current?.stop();
  }, []);

  useEffect(() => {
    const controller = createSeatPollingController({
      fetchAvailability: async (signal) => {
        const response = await fetch(`/api/events/${eventId}/seats`, {
          cache: "no-store",
          signal,
        });

        if (!response.ok) {
          return null;
        }

        const payload = (await response.json()) as { seats?: EventSeat[] };

        return Array.isArray(payload.seats) ? payload.seats : null;
      },
      intervalMs: pollingIntervalMs,
      onSnapshot: applyRemoteSeats,
    });
    pollingControllerRef.current = controller;
    controller.start();

    return () => {
      controller.stop();
      if (pollingControllerRef.current === controller) {
        pollingControllerRef.current = null;
      }
    };
  }, [applyRemoteSeats, eventId]);

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

  function toggleSelection(seat: EventSeat) {
    const nextSelection = toggleSeatSelection(selectedSeatIdsRef.current, seat);

    selectedSeatIdsRef.current = nextSelection;
    setSelectedSeatIds(nextSelection);
  }

  return (
    <section aria-labelledby="seat-map-title" className="mt-12 border-t border-rule pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-code text-xs uppercase tracking-[0.18em] text-accent">Escolha seu lugar</p>
          <h2 id="seat-map-title" className="mt-2 font-display text-3xl">Mapa de assentos</h2>
        </div>
        <p className="text-sm text-ink-muted">{formatCurrency(priceCents)} por ingresso</p>
      </div>

      {notice ? (
        <div className="mt-6 flex items-start justify-between gap-4 border border-warning bg-surface p-4" role="status">
          <p className="text-sm leading-6 text-ink">{notice}</p>
          <button aria-label="Fechar aviso de disponibilidade" className="text-ink-muted hover:text-ink" onClick={() => setNotice(null)} type="button">×</button>
        </div>
      ) : null}

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="overflow-x-auto border border-rule bg-surface p-4 sm:p-6">
          <p className="border-b-4 border-ink pb-2 text-center font-code text-xs font-semibold uppercase tracking-[0.22em] text-ink-muted">Tela</p>
          <div aria-label="Mapa de assentos" className="mx-auto mt-8 min-w-96 space-y-3">
            {rows.map((row) => (
              <div className="grid items-center gap-2" key={row.rowLabel} style={{ gridTemplateColumns: `1.75rem repeat(${row.seats.length}, minmax(2.5rem, 1fr))` }}>
                <span aria-hidden="true" className="font-code text-sm text-ink-muted">{row.rowLabel}</span>
                {row.seats.map((seat) => {
                  const isSelected = selectedSeatIds.includes(seat.id);
                  const isSold = seat.status === "SOLD";
                  const stateLabel = isSold ? "vendido" : isSelected ? "selecionado" : "disponível";

                  return (
                    <button aria-label={`Assento ${seat.label}, ${stateLabel}`} aria-pressed={isSelected} className={isSold ? "min-h-10 cursor-not-allowed border border-ink bg-ink px-2 font-code text-xs text-paper opacity-90" : isSelected ? "min-h-10 border-2 border-ink bg-accent px-2 font-code text-xs font-semibold text-ink" : "min-h-10 border border-rule bg-surface-secondary px-2 font-code text-xs text-ink transition-colors hover:border-ink"} disabled={isSold} key={seat.id} onClick={() => toggleSelection(seat)} type="button">{seat.label}</button>
                  );
                })}
              </div>
            ))}
          </div>
          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-muted"><li>□ Disponível</li><li>▣ Selecionado</li><li>■ Vendido</li></ul>
        </div>

        <aside aria-live="polite" className="h-fit border border-rule bg-surface p-5">
          <p className="font-code text-xs uppercase tracking-[0.18em] text-ink-muted">Sua seleção</p>
          <p className="mt-4 text-sm text-ink-muted">{selectedSeats.length === 0 ? "Nenhum assento selecionado." : selectedSeats.map((seat) => seat.label).join(", ")}</p>
          <dl className="mt-6 space-y-3 border-y border-rule py-4 text-sm"><div className="flex justify-between gap-3"><dt className="text-ink-muted">Ingressos</dt><dd className="font-medium">{selectedSeats.length}</dd></div><div className="flex justify-between gap-3"><dt className="text-ink-muted">Total</dt><dd className="font-semibold">{formatCurrency(totalCents)}</dd></div></dl>
          {selectedSeats.length > 0 ? <Link className="mt-5 block bg-accent px-4 py-3 text-center text-sm font-semibold text-ink transition-colors hover:bg-accent-hover" href={getCheckoutHref(eventId, selectedSeatIds)} onClick={stopPolling}>Continuar para checkout</Link> : <button className="mt-5 w-full cursor-not-allowed border border-rule bg-surface-secondary px-4 py-3 text-sm text-ink-muted" disabled type="button">Selecione um assento</button>}
          <p className="mt-4 text-xs leading-5 text-ink-muted">A disponibilidade é confirmada ao concluir a compra. Esta seleção não reserva assentos.</p>
        </aside>
      </div>
    </section>
  );
}

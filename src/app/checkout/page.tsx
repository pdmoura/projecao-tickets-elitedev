import { notFound } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { formatCurrency, formatEventDate } from "@/modules/events/event-format";
import { EventNotFoundError, getPublishedEvent } from "@/modules/events";
import { EventSeatMismatchError, getEventSeatsByIds } from "@/modules/seats";

export const dynamic = "force-dynamic";

type CheckoutPageProps = {
  searchParams: Promise<{ eventId?: string | string[]; seatId?: string | string[] }>;
};

async function getCheckoutPageData(eventId: string, seatIds: readonly string[]) {
  try {
    return await Promise.all([
      getPublishedEvent(eventId),
      getEventSeatsByIds(eventId, seatIds),
    ]);
  } catch (error) {
    if (
      error instanceof EventNotFoundError ||
      error instanceof EventSeatMismatchError
    ) {
      notFound();
    }

    throw error;
  }
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const resolvedSearchParams = await searchParams;
  const eventId = Array.isArray(resolvedSearchParams.eventId)
    ? resolvedSearchParams.eventId[0]
    : resolvedSearchParams.eventId;
  const seatIds = Array.isArray(resolvedSearchParams.seatId)
    ? resolvedSearchParams.seatId
    : resolvedSearchParams.seatId
      ? [resolvedSearchParams.seatId]
      : [];

  if (!eventId || seatIds.length === 0) {
    notFound();
  }

  const [event, seats] = await getCheckoutPageData(eventId, seatIds);
  const totalCents = seats.length * event.priceCents;

  return (
      <main className="min-h-screen bg-paper px-6 py-8 text-ink sm:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl">
          <AppHeader />
          <section className="py-14">
            <p className="font-code text-xs uppercase tracking-[0.18em] text-accent">
              Revisão da seleção
            </p>
            <h1 className="mt-3 font-display text-5xl leading-[0.95]">
              Checkout em preparação
            </h1>
            <p className="mt-5 max-w-xl leading-7 text-ink-muted">
              A etapa de pagamento será adicionada em seguida. Nenhum assento foi
              reservado ou comprado.
            </p>
            <dl className="mt-10 divide-y divide-rule border-y border-rule bg-surface">
              <div className="p-5">
                <dt className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted">
                  Sessão
                </dt>
                <dd className="mt-2 font-display text-3xl">{event.movie.title}</dd>
                <dd className="mt-2 text-sm text-ink-muted">
                  {formatEventDate(event.startsAt)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 p-5 text-sm">
                <dt className="text-ink-muted">Assentos</dt>
                <dd className="font-medium">{seats.map((seat) => seat.label).join(", ")}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 p-5">
                <dt className="font-semibold">Total previsto</dt>
                <dd className="font-semibold">{formatCurrency(totalCents)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </main>
  );
}

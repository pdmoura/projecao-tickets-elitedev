import Image from "next/image";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { CheckoutForm } from "@/components/checkout-form";
import { getRoleHomePath, getSession } from "@/modules/auth";
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
  const request = new Request("http://localhost", { headers: await headers() });
  const session = await getSession(request);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "CUSTOMER") {
    redirect(getRoleHomePath(session.user.role));
  }

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
        <div className="mx-auto max-w-[88rem]">
          <AppHeader />
          <section className="py-14">
            <p className="font-code text-xs uppercase tracking-[0.18em] text-accent">
              Checkout
            </p>
            <h1 className="mt-3 font-display text-5xl leading-[0.95]">
              Revise e conclua
            </h1>
            <p className="mt-5 max-w-xl leading-7 text-ink-muted">
              A disponibilidade será confirmada novamente dentro da transação de
              compra. Sua seleção ainda não representa uma reserva.
            </p>
            <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(20rem,0.85fr)_minmax(0,1.15fr)] lg:items-start">
              <article className="grid overflow-hidden border border-rule bg-surface sm:grid-cols-[9rem_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[10rem_minmax(0,1fr)]">
                <Image alt={`Pôster de ${event.movie.title}`} className="aspect-[2/3] h-full w-full object-cover" height={600} src={event.movie.posterPath} width={400} />
                <dl className="divide-y divide-rule">
                  <div className="p-5"><dt className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted">Sessão</dt><dd className="mt-3 font-display text-3xl leading-tight">{event.movie.title}</dd><dd className="mt-3 text-sm leading-6 text-ink-muted">{formatEventDate(event.startsAt)}<br />{event.venueName} · {event.roomName}</dd></div>
                  <div className="flex items-center justify-between gap-4 p-5 text-sm"><dt className="text-ink-muted">Assentos</dt><dd className="font-medium">{seats.map((seat) => seat.label).join(", ")}</dd></div>
                  <div className="flex items-center justify-between gap-4 p-5"><dt className="font-semibold">Total previsto</dt><dd className="font-semibold">{formatCurrency(totalCents)}</dd></div>
                </dl>
              </article>
              <CheckoutForm eventId={event.id} seats={seats.map((seat) => ({ id: seat.id, label: seat.label }))} />
            </div>
          </section>
        </div>
      </main>
  );
}

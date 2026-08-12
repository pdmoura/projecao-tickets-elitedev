import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { SeatMap } from "@/components/seat-map";
import {
  formatCurrency,
  formatEventDate,
  formatReleaseYear,
} from "@/modules/events/event-format";
import { EventNotFoundError, getPublicEvent, isCustomerSaleOpen } from "@/modules/events";
import { getEventSeats } from "@/modules/seats";
import { getSession } from "@/modules/auth";

export const dynamic = "force-dynamic";

type EventPageProps = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ seatConflict?: string | string[] }>;
};

async function getEventPageData(eventId: string) {
  try {
    return await getPublicEvent(eventId);
  } catch (error) {
    if (error instanceof EventNotFoundError) {
      notFound();
    }

    throw error;
  }
}

export default async function EventPage({ params, searchParams }: EventPageProps) {
  const request = new Request("http://localhost", { headers: await headers() });
  const session = await getSession(request);
  const { eventId } = await params;
  const resolvedSearchParams = await searchParams;
  const event = await getEventPageData(eventId);
  const saleOpen = isCustomerSaleOpen(new Date(event.startsAt));
  const seats = saleOpen ? await getEventSeats(eventId) : [];
  const availableSeats = seats.filter((seat) => seat.status === "AVAILABLE").length;
  const releaseYear = formatReleaseYear(event.movie.releaseDate);

  return (
      <main className="min-h-screen bg-paper px-6 py-8 text-ink sm:px-10 lg:px-16">
        <div className="mx-auto max-w-[88rem]">
          <AppHeader />
          <article className="grid gap-8 py-10 md:grid-cols-[minmax(13rem,20rem)_minmax(0,1fr)] md:py-14">
            <Image
              alt={`Pôster de ${event.movie.title}`}
              className="w-full border border-rule object-cover"
              height={900}
              priority
              src={event.movie.posterPath}
              width={600}
            />
            <div>
              <p className="font-code text-xs uppercase tracking-[0.18em] text-accent">
                {saleOpen ? "Em cartaz" : "Sessão encerrada para vendas"}
              </p>
              <h1 className="mt-3 font-display text-5xl leading-[0.95] text-balance sm:text-6xl">
                {event.movie.title}
              </h1>
              {releaseYear ? (
                <p className="mt-4 font-code text-sm uppercase tracking-[0.12em] text-ink-muted">
                  {releaseYear}
                </p>
              ) : null}
              {event.movie.overview ? (
                <p className="mt-6 max-w-2xl leading-7 text-ink-muted">
                  {event.movie.overview}
                </p>
              ) : null}
              <dl className="mt-8 grid gap-px border border-rule bg-rule sm:grid-cols-2">
                <div className="bg-surface p-4">
                  <dt className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted">
                    Quando
                  </dt>
                  <dd className="mt-2 text-sm font-medium">
                    {formatEventDate(event.startsAt)}
                  </dd>
                </div>
                <div className="bg-surface p-4">
                  <dt className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted">
                    Onde
                  </dt>
                  <dd className="mt-2 text-sm font-medium">
                    {event.venueName} · {event.roomName}
                  </dd>
                </div>
                <div className="bg-surface p-4">
                  <dt className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted">
                    Preço
                  </dt>
                  <dd className="mt-2 text-sm font-medium">
                    {formatCurrency(event.priceCents)}
                  </dd>
                </div>
                <div className="bg-surface p-4">
                  <dt className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted">
                    Disponibilidade
                  </dt>
                  <dd className="mt-2 text-sm font-medium">
                    {saleOpen ? `${availableSeats} de ${event.capacity} assentos` : "Vendas encerradas"}
                  </dd>
                </div>
              </dl>
            </div>
          </article>
          {!saleOpen ? (
            <section className="mt-12 border-t border-rule pt-8">
              <div className="max-w-2xl border-l-4 border-warning bg-surface-secondary p-6 sm:p-7">
                <p className="font-code text-xs uppercase tracking-[0.16em] text-warning">Sessão encerrada para vendas</p>
                <h2 className="mt-3 font-display text-3xl">Esta sessão já começou.</h2>
                <p className="mt-4 leading-7 text-ink-muted">Esta sessão já começou e não está mais disponível para compra.</p>
                <Link className="mt-6 inline-block bg-accent px-5 py-3 text-sm font-semibold text-ink hover:bg-accent-hover" href="/">Voltar para programação</Link>
              </div>
            </section>
          ) : session?.user.role === "ORGANIZER" ? (
            <section className="mt-12 border-t border-rule pt-8">
              <div className="max-w-2xl border-l-4 border-accent bg-surface-secondary p-6 sm:p-7">
                <p className="font-code text-xs uppercase tracking-[0.16em] text-accent">Acesso de organizador</p>
                <h2 className="mt-3 font-display text-3xl">Você está acessando como organizador.</h2>
                <p className="mt-4 leading-7 text-ink-muted">A compra de ingressos está disponível apenas para clientes. Volte às suas sessões para gerenciar a programação.</p>
                <Link className="mt-6 inline-block bg-accent px-5 py-3 text-sm font-semibold text-ink hover:bg-accent-hover" href="/organizer">Gerenciar sessões</Link>
              </div>
            </section>
          ) : session?.user.role === "GATE" ? (
            <section className="mt-12 border-t border-rule pt-8">
              <div className="max-w-2xl border-l-4 border-gate-valid bg-gate-bg p-6 text-gate-text sm:p-7">
                <p className="font-code text-xs uppercase tracking-[0.14em] text-gate-valid">Acesso de portaria</p>
                <h2 className="mt-3 font-display text-3xl">Você está acessando como portaria.</h2>
                <p className="mt-4 leading-7 text-gate-muted">Use a operação de entrada para validar os ingressos desta sessão.</p>
                <Link className="mt-6 inline-block bg-gate-valid px-5 py-3 text-sm font-semibold text-gate-bg hover:brightness-110" href="/gate">Escanear ingressos</Link>
              </div>
            </section>
          ) : (
            <SeatMap
              eventId={event.id}
              initialSeatConflict={resolvedSearchParams.seatConflict === "1"}
              priceCents={event.priceCents}
              seats={seats}
            />
          )}
        </div>
      </main>
  );
}

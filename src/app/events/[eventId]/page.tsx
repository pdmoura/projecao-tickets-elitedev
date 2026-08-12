import Image from "next/image";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { SeatMap } from "@/components/seat-map";
import {
  formatCurrency,
  formatEventDate,
  formatReleaseYear,
} from "@/modules/events/event-format";
import { EventNotFoundError, getPublishedEvent } from "@/modules/events";
import { getEventSeats } from "@/modules/seats";

export const dynamic = "force-dynamic";

type EventPageProps = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ seatConflict?: string | string[] }>;
};

async function getEventPageData(eventId: string) {
  try {
    return await Promise.all([getPublishedEvent(eventId), getEventSeats(eventId)]);
  } catch (error) {
    if (error instanceof EventNotFoundError) {
      notFound();
    }

    throw error;
  }
}

export default async function EventPage({ params, searchParams }: EventPageProps) {
  const { eventId } = await params;
  const resolvedSearchParams = await searchParams;
  const [event, seats] = await getEventPageData(eventId);
  const availableSeats = seats.filter((seat) => seat.status === "AVAILABLE").length;
  const releaseYear = formatReleaseYear(event.movie.releaseDate);

  return (
      <main className="min-h-screen bg-paper px-6 py-8 text-ink sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
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
                Em cartaz
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
                    {availableSeats} de {event.capacity} assentos
                  </dd>
                </div>
              </dl>
            </div>
          </article>
          <SeatMap
            eventId={event.id}
            initialSeatConflict={resolvedSearchParams.seatConflict === "1"}
            priceCents={event.priceCents}
            seats={seats}
          />
        </div>
      </main>
  );
}

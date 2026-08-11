import Image from "next/image";
import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import { formatCurrency, formatEventDate } from "@/modules/events/event-format";
import { listPublishedEvents } from "@/modules/events";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{ search?: string | string[] }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const search = Array.isArray(resolvedSearchParams.search)
    ? resolvedSearchParams.search[0]
    : resolvedSearchParams.search;
  const events = await listPublishedEvents(search);

  return (
    <main className="min-h-screen bg-paper px-6 py-8 text-ink sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <AppHeader />
        <section className="py-12 sm:py-16">
          <p className="font-code text-xs uppercase tracking-[0.22em] text-accent">
            Cinema independente
          </p>
          <div className="mt-4 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <h1 className="max-w-3xl font-display text-5xl leading-[0.95] text-balance sm:text-6xl">
                Sessões para sair da tela.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-ink-muted sm:text-lg">
                Encontre a próxima sessão, escolha seu lugar e viva o cinema em
                sala.
              </p>
            </div>
            <form action="/" className="w-full max-w-sm">
              <label
                className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted"
                htmlFor="event-search"
              >
                Buscar na programação
              </label>
              <div className="mt-2 flex border border-rule bg-surface">
                <input
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none"
                  defaultValue={search}
                  id="event-search"
                  name="search"
                  placeholder="Título do filme"
                  type="search"
                />
                <button
                  className="bg-accent px-4 text-sm font-semibold text-ink hover:bg-accent-hover"
                  type="submit"
                >
                  Buscar
                </button>
              </div>
            </form>
          </div>
        </section>

        {events.length === 0 ? (
          <section className="border-y border-rule py-16 text-center">
            <h2 className="font-display text-3xl">Nenhuma sessão encontrada</h2>
            <p className="mt-3 text-ink-muted">
              Tente outro título ou volte para toda a programação.
            </p>
          </section>
        ) : (
          <section
            aria-label="Sessões em cartaz"
            className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-6 pb-16"
          >
            {events.map((event) => (
              <article className="border border-rule bg-surface" key={event.id}>
                <Link className="block" href={`/events/${event.id}`}>
                  <Image
                    alt=""
                    className="aspect-[2/3] w-full object-cover"
                    height={900}
                    src={event.movie.posterPath}
                    width={600}
                  />
                  <div className="p-5">
                    <p className="font-code text-xs uppercase tracking-[0.13em] text-accent">
                      {formatEventDate(event.startsAt)}
                    </p>
                    <h2 className="mt-3 font-display text-3xl leading-tight">
                      {event.movie.title}
                    </h2>
                    <p className="mt-3 text-sm text-ink-muted">
                      {event.venueName} · {event.roomName}
                    </p>
                    <p className="mt-4 text-sm font-semibold">
                      A partir de {formatCurrency(event.priceCents)}
                    </p>
                  </div>
                </Link>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

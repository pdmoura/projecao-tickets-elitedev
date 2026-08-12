import Image from "next/image";
import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import { HomeFooter } from "@/components/home-footer";
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
    <main className="min-h-screen bg-paper px-6 pb-0 pt-8 text-ink sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[88rem]">
        <AppHeader />
        <section className="mx-auto max-w-[62rem] py-12 sm:py-16">
          <p className="inline-flex bg-ink px-3 py-1.5 font-code text-[0.7rem] font-medium uppercase tracking-[0.12em] text-accent">
            Cinema independente
          </p>
          <div className="mt-4">
            <h1 className="max-w-3xl font-display text-5xl leading-[0.95] text-balance sm:text-6xl">
              Sessões para sair da tela.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-ink-muted sm:text-lg">
              Encontre a próxima sessão, escolha seu lugar e viva o cinema em
              sala.
            </p>
            <form action="/" className="mt-8 w-full max-w-[56rem]">
              <label
                className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted"
                htmlFor="event-search"
              >
                Buscar na programação
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-0">
                <input
                  className="min-w-0 flex-1 border border-rule bg-surface px-3 py-3 text-sm outline-none sm:border-r-0"
                  defaultValue={search}
                  id="event-search"
                  name="search"
                  placeholder="Título do filme"
                  type="search"
                />
                <button
                  className="bg-accent px-5 py-3 text-sm font-semibold text-ink hover:bg-accent-hover"
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
            className="grid grid-cols-1 gap-6 pb-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {events.map((event) => (
              <article className="group overflow-hidden border border-rule bg-surface transition duration-200 hover:-translate-y-0.5 hover:border-ink hover:shadow-[0_14px_30px_rgba(20,20,20,0.08)]" key={event.id}>
                <Link className="block" href={`/events/${event.id}`}>
                  <Image
                    alt=""
                    className="aspect-[2/3] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
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
        <section className="border-t border-rule py-14 sm:py-20">
          <p className="inline-flex bg-ink px-3 py-1.5 font-code text-[0.7rem] font-medium uppercase tracking-[0.12em] text-accent">Como funciona</p>
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)] lg:gap-14">
            <div className="grid gap-px border border-rule bg-rule sm:grid-cols-3">
              {[
                ["01", "Escolha uma sessão", "Encontre um filme na programação e veja data, horário e sala."],
                ["02", "Escolha seu lugar", "Selecione os assentos disponíveis no mapa da sala."],
                ["03", "Leve seu ingresso", "Finalize o pagamento de teste e use o QR Code na entrada."],
              ].map(([number, title, description]) => (
                <article className="bg-surface p-6 sm:p-7" key={number}>
                  <p className="font-code text-xs tracking-[0.16em] text-accent">{number}</p>
                  <h2 className="mt-5 font-display text-3xl leading-tight">{title}</h2>
                  <p className="mt-4 text-sm leading-6 text-ink-muted">{description}</p>
                </article>
              ))}
            </div>
            <div className="border-l-4 border-accent bg-surface-secondary p-7 sm:p-8">
              <p className="font-display text-3xl leading-tight">Cinema que acontece</p>
              <p className="mt-4 max-w-md leading-7 text-ink-muted">
                Uma plataforma para organizar sessões, escolher lugares e validar ingressos em um fluxo simples.
              </p>
            </div>
          </div>
        </section>
      </div>
      <HomeFooter />
    </main>
  );
}

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

const steps = [
  {
    description: "Encontre um filme na programação e veja data, horário e sala.",
    icon: "/brand/icons/sessao.png",
    title: "Escolha uma sessão",
  },
  {
    description: "Selecione os assentos disponíveis no mapa da sala.",
    icon: "/brand/icons/lugar.png",
    title: "Escolha seu lugar",
  },
  {
    description: "Finalize o pagamento de teste e use o QR Code na entrada.",
    icon: "/brand/icons/ingresso.png",
    title: "Leve seu ingresso",
  },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3" aria-label={children}>
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-accent" />
      <p className="shrink-0 font-code text-xs font-medium uppercase tracking-[0.16em] text-ink">
        {children}
      </p>
      <span aria-hidden="true" className="h-px w-full bg-rule" />
    </div>
  );
}

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
        <section className="grid items-center gap-8 py-12 sm:py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10 xl:gap-14">
          <div className="min-w-0">
            <p className="inline-flex bg-ink px-3 py-1.5 font-code text-[0.7rem] font-medium uppercase tracking-[0.12em] text-accent">
              Cinema independente
            </p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[0.95] text-balance sm:text-6xl xl:text-7xl">
              Sessões para sair da tela.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-ink-muted sm:text-lg">
              Encontre a próxima sessão, escolha seu lugar e viva o cinema em sala.
            </p>
            <form action="/" className="mt-8 w-full max-w-[48rem]">
              <label className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted" htmlFor="event-search">
                Buscar na programação
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-0">
                <input className="min-w-0 flex-1 border border-rule bg-surface px-3 py-3 text-sm outline-none sm:border-r-0" defaultValue={search} id="event-search" name="search" placeholder="Título do filme" type="search" />
                <button className="bg-accent px-5 py-3 text-sm font-semibold text-ink hover:bg-accent-hover" type="submit">Buscar</button>
              </div>
            </form>
          </div>
          <div className="min-w-0 lg:justify-self-end">
            <Image alt="Ilustração editorial de uma sala de cinema" className="h-auto w-full object-contain" height={900} priority src="/brand/illustrations/cinema-hero.png" width={1100} />
          </div>
        </section>

        <section aria-label="Sessões em cartaz" className="pb-16">
          <SectionLabel>Em cartaz</SectionLabel>
          {events.length === 0 ? (
            <div className="mt-6 border-y border-rule py-16 text-center">
              <h2 className="font-display text-3xl">Nenhuma sessão encontrada</h2>
              <p className="mt-3 text-ink-muted">Tente outro título ou volte para toda a programação.</p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {events.map((event) => (
                <article className="group overflow-hidden border border-rule bg-surface transition duration-200 hover:-translate-y-0.5 hover:border-ink hover:shadow-[0_14px_30px_rgba(20,20,20,0.08)]" key={event.id}>
                  <Link className="block" href={`/events/${event.id}`}>
                  <Image alt="" className="aspect-[2/3] w-full object-cover transition duration-500 group-hover:scale-[1.02]" height={900} src={event.movie.posterPath} width={600} />
                    <div className="p-3.5 sm:p-4 lg:p-5">
                      <p className="font-code text-[0.62rem] uppercase tracking-[0.1em] text-ink-muted sm:text-xs sm:tracking-[0.13em]">{formatEventDate(event.startsAt)}</p>
                      <h2 className="mt-2 line-clamp-2 font-display text-xl leading-tight sm:mt-3 sm:text-2xl lg:text-3xl">{event.movie.title}</h2>
                      <p className="mt-2 truncate text-xs text-ink-muted sm:mt-3 sm:text-sm">{event.venueName} · {event.roomName}</p>
                      <p className="mt-3 text-xs font-semibold sm:mt-4 sm:text-sm">A partir de {formatCurrency(event.priceCents)}</p>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <section
          className="scroll-mt-28 border-t border-rule py-14 sm:py-20"
          id="como-funciona"
        >
          <SectionLabel>Como funciona</SectionLabel>
          <div className="mt-8 grid divide-y divide-rule border-y border-rule lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {steps.map((step) => (
              <article className="flex gap-4 px-0 py-7 sm:gap-5 sm:px-4 lg:px-7 lg:py-4" key={step.title}>
                <Image alt="" aria-hidden="true" className="mt-0.5 size-14 shrink-0 object-contain brightness-0 contrast-150 sm:size-16" height={80} src={step.icon} width={80} />
                <div>
                  <h2 className="font-display text-3xl leading-tight">{step.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-ink-muted">{step.description}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-10 grid gap-8 bg-surface-secondary p-6 sm:p-8 lg:grid-cols-[minmax(13rem,0.8fr)_minmax(16rem,0.9fr)_minmax(16rem,0.8fr)] lg:items-center lg:gap-10">
            <Image alt="Ilustração de pessoas chegando ao cinema" className="mx-auto h-auto w-full max-w-sm object-contain" height={540} src="/brand/illustrations/casal.png" width={540} />
            <div className="lg:border-x lg:border-rule lg:px-10">
              <h2 className="font-display text-4xl leading-tight">Cinema que acontece</h2>
              <p className="mt-4 leading-7 text-ink-muted">Uma plataforma para organizar sessões, escolher lugares e validar ingressos em um fluxo simples.</p>
            </div>
            <ul className="space-y-4 text-sm leading-6 text-ink-muted">
              <li className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />Programação em um só lugar</li>
              <li className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />Escolha de assentos simples</li>
              <li className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />Ingresso com QR para entrada</li>
            </ul>
          </div>
        </section>
      </div>
      <HomeFooter />
    </main>
  );
}

import Image from "next/image";
import { notFound } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { formatCurrency, formatEventDate } from "@/modules/events/event-format";
import { getSharedTicket, TicketNotFoundError } from "@/modules/tickets";

export const dynamic = "force-dynamic";

type SharedTicketPageProps = {
  params: Promise<{ shareToken: string }>;
};

export default async function SharedTicketPage({ params }: SharedTicketPageProps) {
  const { shareToken } = await params;
  let ticket;

  try {
    ticket = await getSharedTicket(shareToken);
  } catch (error) {
    if (error instanceof TicketNotFoundError) {
      notFound();
    }

    throw error;
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-6 text-ink sm:px-8 sm:py-8 lg:px-16">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-rule pb-5"><BrandLogo priority /></header>
        <section className="py-10 sm:py-14">
          <p className="font-code text-xs uppercase tracking-[0.18em] text-accent">Ingresso compartilhado</p>
          <h1 className="mt-3 font-display text-5xl leading-[0.95]">Seu acesso para a sessão</h1>
          <p className="mt-5 border-l-4 border-accent bg-surface p-4 text-sm leading-6 text-ink-muted">Este link permite a visualização do ingresso. A compra e a propriedade continuam com o comprador.</p>
          <article className="relative mt-8 overflow-hidden border border-rule bg-surface shadow-[0_24px_60px_rgba(20,20,20,0.08)]">
            <div className="grid md:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="p-6 sm:p-8">
                <p className="font-code text-xs uppercase tracking-[0.16em] text-accent">Projeção · ingresso</p>
                <h2 className="mt-6 font-display text-4xl leading-[0.95]">{ticket.event.movieTitle}</h2>
                <dl className="mt-8 grid gap-5 border-y border-rule py-6 sm:grid-cols-2">
                  <div><dt className="font-code text-xs uppercase tracking-[0.12em] text-ink-muted">Sessão</dt><dd className="mt-2 text-sm font-medium">{formatEventDate(ticket.event.startsAt)}</dd></div>
                  <div><dt className="font-code text-xs uppercase tracking-[0.12em] text-ink-muted">Local</dt><dd className="mt-2 text-sm font-medium">{ticket.event.venueName} · {ticket.event.roomName}</dd></div>
                  <div><dt className="font-code text-xs uppercase tracking-[0.12em] text-ink-muted">Assento</dt><dd className="mt-2 font-display text-4xl">{ticket.seatLabel}</dd></div>
                  <div><dt className="font-code text-xs uppercase tracking-[0.12em] text-ink-muted">Valor</dt><dd className="mt-2 text-sm font-medium">{formatCurrency(ticket.unitPriceCents)}</dd></div>
                </dl>
              </div>
              <div className="border-t border-dashed border-ink/30 bg-surface-secondary p-6 text-center md:border-l md:border-t-0">
                <p className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted">Entrada individual</p>
                <div className="mx-auto mt-5 w-fit bg-white p-1"><Image alt={`QR de validação do assento ${ticket.seatLabel}`} height={280} src={ticket.qrDataUrl} unoptimized width={280} /></div>
                <p className="mt-5 text-xs text-ink-muted">Código manual</p>
                <p className="mt-2 font-code text-base font-medium tracking-[0.12em]">{ticket.manualCode}</p>
              </div>
            </div>
          </article>
          <p className="mt-6 text-sm leading-6 text-ink-muted">Apresente o QR ou o código manual na portaria. O uso válido consome o ingresso uma única vez.</p>
        </section>
      </div>
    </main>
  );
}

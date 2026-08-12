import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { ShareTicketButton } from "@/components/share-ticket-button";
import { getRoleHomePath, getSession } from "@/modules/auth";
import { formatCurrency, formatEventDate } from "@/modules/events/event-format";
import { getTicket, TicketNotFoundError } from "@/modules/tickets";

export const dynamic = "force-dynamic";

type TicketPageProps = {
  params: Promise<{ ticketId: string }>;
};

export default async function TicketPage({ params }: TicketPageProps) {
  const request = new Request("http://localhost", { headers: await headers() });
  const session = await getSession(request);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "CUSTOMER") {
    redirect(getRoleHomePath(session.user.role));
  }

  const { ticketId } = await params;
  let ticket;

  try {
    ticket = await getTicket(session.user.id, ticketId);
  } catch (error) {
    if (error instanceof TicketNotFoundError) {
      notFound();
    }

    throw error;
  }

  return (
    <main className="min-h-screen bg-paper px-6 py-8 text-ink sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <AppHeader />
        <section className="py-10 sm:py-14">
          <Link className="text-sm underline underline-offset-4" href="/tickets">
            ← Voltar para meus ingressos
          </Link>

          <article className="relative mx-auto mt-8 max-w-4xl overflow-hidden border border-rule bg-surface shadow-[0_24px_60px_rgba(20,20,20,0.08)]">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="p-7 sm:p-10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-code text-xs uppercase tracking-[0.18em] text-accent">
                    Projeção · ingresso
                  </p>
                  <span
                    className={`font-code text-xs uppercase tracking-[0.14em] ${
                      ticket.status === "USED" ? "text-ink-muted" : "text-success"
                    }`}
                  >
                    {ticket.status === "USED" ? "Ingresso utilizado" : "Pronto para entrada"}
                  </span>
                </div>
                <h1 className="mt-8 font-display text-5xl leading-[0.95] sm:text-6xl">
                  {ticket.event.movieTitle}
                </h1>
                <dl className="mt-10 grid gap-6 border-y border-rule py-7 sm:grid-cols-2">
                  <div>
                    <dt className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted">
                      Sessão
                    </dt>
                    <dd className="mt-2 text-sm font-medium">
                      {formatEventDate(ticket.event.startsAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted">
                      Sala
                    </dt>
                    <dd className="mt-2 text-sm font-medium">
                      {ticket.event.venueName} · {ticket.event.roomName}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted">
                      Assento
                    </dt>
                    <dd className="mt-2 font-display text-4xl">{ticket.seatLabel}</dd>
                  </div>
                  <div>
                    <dt className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted">
                      Titular · valor
                    </dt>
                    <dd className="mt-2 text-sm font-medium">{ticket.holderName}</dd>
                    <dd className="mt-1 text-sm text-ink-muted">
                      {formatCurrency(ticket.unitPriceCents)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-6 text-sm leading-6 text-ink-muted">
                  Apresente este ingresso na portaria. Cada QR é individual e
                  válido somente para o assento indicado.
                </p>
                <ShareTicketButton ticketId={ticket.id} />
              </div>

              <div className="relative border-t border-dashed border-ink/30 bg-surface-secondary p-7 text-center lg:border-l lg:border-t-0">
                <span className="absolute -left-3 -top-3 hidden size-6 rounded-full border border-rule bg-paper lg:block" />
                <span className="absolute -bottom-3 -left-3 hidden size-6 rounded-full border border-rule bg-paper lg:block" />
                <p className="font-code text-xs uppercase tracking-[0.16em] text-ink-muted">
                  Entrada individual
                </p>
                <div className="mx-auto mt-6 w-fit bg-white p-1">
                  <Image
                    alt={`QR de validação do assento ${ticket.seatLabel}`}
                    height={320}
                    priority
                    src={ticket.qrDataUrl}
                    unoptimized
                    width={320}
                  />
                </div>
                <p className="mt-5 text-xs text-ink-muted">Código manual</p>
                <p className="mt-2 font-code text-lg font-medium tracking-[0.14em]">
                  {ticket.manualCode}
                </p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

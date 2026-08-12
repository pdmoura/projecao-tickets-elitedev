import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { groupTicketsByEvent } from "@/components/ticket-groups";
import { getRoleHomePath, getSession } from "@/modules/auth";
import { formatEventDate } from "@/modules/events/event-format";
import { listTickets } from "@/modules/tickets";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const request = new Request("http://localhost", { headers: await headers() });
  const session = await getSession(request);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "CUSTOMER") {
    redirect(getRoleHomePath(session.user.role));
  }

  const tickets = await listTickets(session.user.id);
  const ticketGroups = groupTicketsByEvent(tickets);

  return (
    <main className="min-h-screen bg-paper px-6 py-8 text-ink sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[88rem]">
        <AppHeader />
        <section className="py-12 sm:py-16">
          <p className="inline-flex bg-ink px-3 py-1.5 font-code text-[0.7rem] font-medium uppercase tracking-[0.12em] text-accent">
            Área do cliente
          </p>
          <h1 className="mt-3 font-display text-5xl leading-none sm:text-6xl">
            Meus ingressos
          </h1>
          <p className="mt-5 max-w-2xl leading-7 text-ink-muted">
            Cada assento tem seu próprio ingresso. Abra-o para apresentar o QR
            ou o código manual na portaria.
          </p>

          {tickets.length === 0 ? (
            <div className="mt-10 border border-rule bg-surface p-8">
              <h2 className="font-display text-3xl">Nenhum ingresso ainda</h2>
              <p className="mt-3 text-ink-muted">
                Escolha uma sessão e conclua a compra para emitir seu ingresso.
              </p>
              <Link
                className="mt-6 inline-block bg-accent px-5 py-3 font-semibold hover:bg-accent-hover"
                href="/"
              >
                Ver programação
              </Link>
            </div>
          ) : (
            <ul className="mt-10 grid gap-7">
              {ticketGroups.map((group) => (
                <li key={group.event.id}>
                  <article className="overflow-hidden border border-rule bg-surface">
                    <div className="grid gap-0 md:grid-cols-[10rem_minmax(0,1fr)] lg:grid-cols-[11rem_minmax(0,1fr)]">
                      <Image
                        alt={`Pôster de ${group.event.movieTitle}`}
                        className="aspect-[2/3] h-full w-full object-cover"
                        height={600}
                        src={group.event.posterPath}
                        width={400}
                      />
                      <div className="min-w-0 p-6 sm:p-7">
                        <p className="font-code text-xs uppercase tracking-[0.14em] text-accent">
                          {group.tickets.length} {group.tickets.length === 1 ? "ingresso" : "ingressos"}
                        </p>
                        <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
                          {group.event.movieTitle}
                        </h2>
                        <p className="mt-4 text-base font-medium leading-7 text-ink">
                          {formatEventDate(group.event.startsAt)}
                        </p>
                        <p className="mt-1 text-sm text-ink-muted">
                          {group.event.venueName} · {group.event.roomName}
                        </p>
                        <ul className="mt-7 divide-y divide-rule border-y border-rule">
                          {group.tickets.map((ticket) => (
                            <li className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4" key={ticket.id}>
                              <p className="font-code text-sm uppercase tracking-[0.12em] text-ink">
                                Assento <strong className="font-code text-base">{ticket.seatLabel}</strong>
                              </p>
                              <div className="flex items-center gap-5">
                                <span
                                  className={`font-code text-[0.68rem] font-medium uppercase tracking-[0.12em] ${
                                    ticket.status === "USED" ? "text-ink-muted" : "text-success"
                                  }`}
                                >
                                  {ticket.status === "USED" ? "Utilizado" : "Válido"}
                                </span>
                                <Link
                                  className="text-sm font-semibold underline decoration-accent decoration-2 underline-offset-4 hover:text-ink-muted"
                                  href={`/tickets/${ticket.id}`}
                                >
                                  Abrir ingresso
                                </Link>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

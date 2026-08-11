import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
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

  return (
    <main className="min-h-screen bg-paper px-6 py-8 text-ink sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <AppHeader />
        <section className="py-12 sm:py-16">
          <p className="font-code text-xs uppercase tracking-[0.18em] text-accent">
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
            <ul className="mt-10 grid gap-5 sm:grid-cols-2">
              {tickets.map((ticket) => (
                <li key={ticket.id}>
                  <Link
                    className="group block border border-rule bg-surface p-6 transition hover:-translate-y-0.5 hover:border-ink"
                    href={`/tickets/${ticket.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted">
                        Assento {ticket.seatLabel}
                      </p>
                      <span
                        className={`font-code text-[0.68rem] uppercase tracking-[0.12em] ${
                          ticket.status === "USED" ? "text-ink-muted" : "text-success"
                        }`}
                      >
                        {ticket.status === "USED" ? "Utilizado" : "Válido"}
                      </span>
                    </div>
                    <h2 className="mt-5 font-display text-3xl leading-tight">
                      {ticket.event.movieTitle}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-ink-muted">
                      {formatEventDate(ticket.event.startsAt)}
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {ticket.event.venueName} · {ticket.event.roomName}
                    </p>
                    <p className="mt-6 text-sm font-semibold underline decoration-accent decoration-2 underline-offset-4">
                      Abrir ingresso
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

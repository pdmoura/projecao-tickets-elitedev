import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/modules/auth/logout-button";
import { getRoleHomePath, getSession } from "@/modules/auth";

export default async function OrganizerPage() {
  const request = new Request("http://localhost", { headers: await headers() });
  const session = await getSession(request);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ORGANIZER") {
    redirect(getRoleHomePath(session.user.role));
  }

  return (
    <main className="min-h-screen bg-paper px-6 py-8 text-ink sm:px-10 lg:px-16">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between border-b border-rule pb-5">
          <p className="font-code text-xs uppercase tracking-[0.18em] text-ink-muted">
            Área do organizador
          </p>
          <LogoutButton />
        </header>
        <section className="py-20">
          <h1 className="font-display text-5xl leading-none">Olá, {session.user.name}.</h1>
          <p className="mt-5 text-ink-muted">
            A gestão de sessões será disponibilizada nas próximas etapas.
          </p>
        </section>
      </div>
    </main>
  );
}

import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { getRoleHomePath, getSession } from "@/modules/auth";
import { LoginForm } from "@/modules/auth/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const request = new Request("http://localhost", {
    headers: await headers(),
  });
  const session = await getSession(request);

  if (session) {
    redirect(getRoleHomePath(session.user.role));
  }

  return (
    <main className="min-h-screen bg-paper text-ink lg:grid lg:grid-cols-[minmax(22rem,0.85fr)_minmax(34rem,1.15fr)]">
      <aside className="relative isolate hidden min-h-screen overflow-hidden bg-ink p-10 text-paper lg:flex lg:flex-col lg:p-14">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: "url('/brand/login-cinema-bg.webp')" }} />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(9,16,24,0.58),rgba(9,16,24,0.9))]" />
        <BrandLogo className="h-auto w-64" inverse priority />
        <div className="my-auto max-w-md text-shadow-[0_2px_18px_rgba(0,0,0,0.65)]">
          <p className="font-code text-xs uppercase tracking-[0.22em] text-accent">
            Projeção
          </p>
          <p className="mt-6 font-display text-6xl leading-[0.92] text-balance">
            O cinema acontece aqui.
          </p>
          <p className="mt-7 max-w-sm text-lg leading-8 text-paper/75">
            Uma sessão começa com a programação e termina na entrada da sala.
          </p>
        </div>
        <p className="font-code text-xs uppercase tracking-[0.16em] text-accent">
          Sessões, lugares e encontros.
        </p>
      </aside>

      <section className="flex min-h-screen px-6 py-8 sm:px-10 lg:px-16 lg:py-14">
        <div className="mx-auto flex w-full max-w-xl flex-col">
          <header className="flex items-center justify-between border-b border-rule pb-5 lg:justify-end">
            <div className="lg:hidden">
              <BrandLogo priority />
            </div>
            <Link
              className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted underline decoration-accent decoration-2 underline-offset-4"
              href="/"
            >
              Voltar à programação
            </Link>
          </header>

          <section className="flex flex-1 flex-col justify-center py-16 lg:py-20">
            <p className="inline-flex w-fit bg-ink px-3 py-1.5 font-code text-[0.7rem] font-medium uppercase tracking-[0.12em] text-accent">
              Acesso
            </p>
            <h1 className="mt-4 font-display text-5xl leading-none text-balance sm:text-6xl">
              Entre na sua sessão.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-ink-muted">
              Use uma das contas de demonstração cadastradas para esta avaliação.
            </p>
            <div className="mt-9 border-t border-rule pt-7">
              <LoginForm />
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

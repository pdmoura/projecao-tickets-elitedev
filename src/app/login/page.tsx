import { BrandLogo } from "@/components/brand-logo";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/modules/auth/login-form";
import { getRoleHomePath, getSession } from "@/modules/auth";

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
    <main className="min-h-screen bg-paper px-6 py-8 text-ink sm:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col">
        <header className="flex items-center justify-between border-b border-rule pb-5">
          <BrandLogo priority />
          <Link
            className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted underline decoration-accent decoration-2 underline-offset-4"
            href="/"
          >
            Voltar
          </Link>
        </header>

        <section className="flex flex-1 flex-col justify-center py-16">
          <p className="font-code text-xs uppercase tracking-[0.2em] text-accent">
            Acesso
          </p>
          <h1 className="mt-4 font-display text-5xl leading-none text-balance">
            Entre na sua sessão.
          </h1>
          <p className="mt-5 text-base leading-7 text-ink-muted">
            Use uma das contas de demonstração cadastradas para esta avaliação.
          </p>
          <div className="mt-9 border-t border-rule pt-7">
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}

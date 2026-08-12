"use client";

import Link from "next/link";

type RouteErrorProps = {
  description?: string;
  reset: () => void;
  returnHref?: string;
  returnLabel?: string;
  title?: string;
};

export function RouteError({
  description = "Não foi possível carregar esta página agora. Tente novamente ou volte para a programação.",
  reset,
  returnHref = "/",
  returnLabel = "Voltar à programação",
  title = "A projeção foi interrompida",
}: RouteErrorProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-6 py-12 text-ink sm:px-10">
      <section className="w-full max-w-xl border-y border-rule py-10 text-center sm:py-14">
        <p className="font-code text-xs uppercase tracking-[0.2em] text-accent">Erro temporário</p>
        <h1 className="mt-4 font-display text-5xl leading-[0.95] sm:text-6xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-md leading-7 text-ink-muted">{description}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button className="bg-accent px-5 py-3 text-sm font-semibold hover:bg-accent-hover" onClick={reset} type="button">
            Tentar novamente
          </button>
          <Link className="border border-rule px-5 py-3 text-sm font-semibold hover:bg-surface-secondary" href={returnHref}>
            {returnLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}

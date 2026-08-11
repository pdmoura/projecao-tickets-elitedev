import Link from "next/link";

import { BrandLogo } from "./brand-logo";

export function AppHeader() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-rule pb-5">
      <BrandLogo priority />
      <nav aria-label="Navegação principal" className="flex items-center gap-5">
        <Link
          className="font-code text-xs font-medium uppercase tracking-[0.14em] text-ink underline decoration-accent decoration-2 underline-offset-4"
          href="/"
        >
          Programação
        </Link>
        <Link
          className="font-code text-xs font-medium uppercase tracking-[0.14em] text-ink underline decoration-accent decoration-2 underline-offset-4"
          href="/tickets"
        >
          Meus ingressos
        </Link>
        <Link
          className="font-code text-xs font-medium uppercase tracking-[0.14em] text-ink underline decoration-accent decoration-2 underline-offset-4"
          href="/login"
        >
          Entrar
        </Link>
      </nav>
    </header>
  );
}

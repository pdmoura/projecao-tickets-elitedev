import { headers } from "next/headers";
import Link from "next/link";

import { LogoutButton } from "@/modules/auth/logout-button";
import { getSession } from "@/modules/auth";

import { BrandLogo } from "./brand-logo";

const navigationLinkClassName =
  "font-code text-xs font-medium uppercase tracking-[0.14em] text-ink underline decoration-accent decoration-2 underline-offset-4";

export async function AppHeader() {
  const request = new Request("http://localhost", {
    headers: await headers(),
  });
  const session = await getSession(request);

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-5">
      <BrandLogo priority />
      <nav
        aria-label="Navegação principal"
        className="flex flex-wrap items-center justify-end gap-x-5 gap-y-3"
      >
        <Link className={navigationLinkClassName} href="/">
          Programação
        </Link>
        {session?.user.role === "CUSTOMER" ? (
          <Link className={navigationLinkClassName} href="/tickets">
            Meus ingressos
          </Link>
        ) : null}
        {session?.user.role === "ORGANIZER" ? (
          <Link className={navigationLinkClassName} href="/organizer">
            Área do organizador
          </Link>
        ) : null}
        {session?.user.role === "GATE" ? (
          <Link className={navigationLinkClassName} href="/gate">
            Portaria
          </Link>
        ) : null}
        {session ? (
          <LogoutButton />
        ) : (
          <Link className={navigationLinkClassName} href="/login">
            Entrar
          </Link>
        )}
      </nav>
    </header>
  );
}

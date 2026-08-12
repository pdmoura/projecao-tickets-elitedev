import { headers } from "next/headers";
import Link from "next/link";

import { LogoutButton } from "@/modules/auth/logout-button";
import { getSession } from "@/modules/auth";

import { BrandLogo } from "./brand-logo";

const navigationLinkClassName =
  "font-code text-[0.68rem] font-medium uppercase tracking-[0.13em] text-ink underline decoration-accent decoration-2 underline-offset-4 transition-colors hover:text-ink-muted sm:text-xs";

export async function AppHeader() {
  const request = new Request("http://localhost", {
    headers: await headers(),
  });
  const session = await getSession(request);

  return (
    <header className="sticky top-0 z-40 -mx-6 flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b border-rule bg-paper/95 px-6 py-4 shadow-[0_1px_0_rgba(20,20,20,0.03)] backdrop-blur-md sm:-mx-10 sm:px-10 sm:py-5 lg:-mx-16 lg:px-16">
      <BrandLogo className="h-auto w-36 sm:w-44 lg:w-[14rem]" priority />
      <nav
        aria-label="Navegação principal"
        className="ml-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-2 sm:gap-x-5 sm:gap-y-3"
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

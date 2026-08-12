import { headers } from "next/headers";
import { LogoutButton } from "@/modules/auth/logout-button";
import { getSession } from "@/modules/auth";

import { BrandLogo } from "./brand-logo";
import { HeaderNavigation } from "./header-navigation";

export async function AppHeader() {
  const request = new Request("http://localhost", {
    headers: await headers(),
  });
  const session = await getSession(request);

  return (
    <header className="sticky top-0 z-40 -mx-6 flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b border-rule bg-paper/95 px-6 py-4 shadow-[0_1px_0_rgba(20,20,20,0.03)] backdrop-blur-md sm:-mx-10 sm:px-10 sm:py-5 lg:-mx-16 lg:px-16">
      <BrandLogo className="h-auto w-40 sm:w-52 lg:w-[16rem]" priority />
      <nav
        aria-label="Navegação principal"
        className="ml-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-2 sm:gap-x-5 sm:gap-y-3"
      >
        <HeaderNavigation
          items={[
            { href: "/", label: "Programação" },
            ...(session?.user.role === "CUSTOMER"
              ? [{ href: "/tickets", label: "Meus ingressos" }]
              : []),
            ...(session?.user.role === "ORGANIZER"
              ? [{ href: "/organizer", label: "Área do organizador" }]
              : []),
            ...(session?.user.role === "GATE"
              ? [{ href: "/gate", label: "Portaria" }]
              : []),
          ]}
        />
        {session ? (
          <LogoutButton />
        ) : (
          <HeaderNavigation items={[{ href: "/login", label: "Entrar" }]} />
        )}
      </nav>
    </header>
  );
}

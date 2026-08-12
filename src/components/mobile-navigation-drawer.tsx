"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/modules/auth/logout-button";

import { isActiveNavigationPath, type NavigationItem } from "./header-navigation";

type MobileNavigationDrawerProps = {
  isAuthenticated: boolean;
  items: NavigationItem[];
};

export function MobileNavigationDrawer({
  isAuthenticated,
  items,
}: MobileNavigationDrawerProps) {
  const pathname = usePathname();
  const drawerId = useId();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const primaryItems = [
    ...items,
    ...(isAuthenticated ? [] : [{ href: "/login", label: "Entrar" }]),
  ];

  return (
    <div className="min-[501px]:hidden">
      <button
        aria-controls={drawerId}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        className="grid size-11 place-items-center border border-rule bg-surface text-ink transition hover:border-accent hover:bg-surface-secondary"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span aria-hidden="true" className="grid gap-1.5">
          <span className={`block h-px w-5 bg-current transition-transform duration-200 ${isOpen ? "translate-y-[7px] rotate-45" : ""}`} />
          <span className={`block h-px w-5 bg-current transition-opacity duration-200 ${isOpen ? "opacity-0" : ""}`} />
          <span className={`block h-px w-5 bg-current transition-transform duration-200 ${isOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
        </span>
      </button>

      <div
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-50 bg-ink/45 backdrop-blur-[2px] transition-opacity duration-200 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setIsOpen(false)}
      >
        <aside
          aria-label="Navegação móvel"
          className={`ml-auto flex h-full w-[min(88vw,24rem)] flex-col border-l border-rule bg-paper px-7 py-7 shadow-2xl transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
          id={drawerId}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-rule pb-5">
            <p className="font-code text-xs font-medium uppercase tracking-[0.18em] text-ink-muted">
              Navegação
            </p>
            <button
              aria-label="Fechar menu"
              className="grid size-10 place-items-center border border-rule text-ink transition hover:border-accent hover:bg-surface-secondary"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <span aria-hidden="true" className="font-display text-3xl leading-none">×</span>
            </button>
          </div>

          <nav className="mt-10 grid gap-2 text-center" aria-label="Links do menu">
            {primaryItems.map((item) => {
              const isActive = isActiveNavigationPath(pathname, item.href);

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`border-b border-rule px-3 py-4 font-display text-3xl transition-colors hover:text-accent ${isActive ? "text-ink underline decoration-accent decoration-2 underline-offset-8" : "text-ink-muted"}`}
                  href={item.href}
                  key={item.href}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            {isAuthenticated ? (
              <div className="mt-4 flex justify-center">
                <LogoutButton onComplete={() => setIsOpen(false)} />
              </div>
            ) : null}
          </nav>

          <nav className="mt-auto grid gap-3 border-t border-rule pt-6 text-center" aria-label="Informações legais">
            <Link className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted hover:text-ink" href="/privacy" onClick={() => setIsOpen(false)}>Política de privacidade</Link>
            <Link className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted hover:text-ink" href="/terms" onClick={() => setIsOpen(false)}>Termos de uso</Link>
          </nav>
        </aside>
      </div>
    </div>
  );
}

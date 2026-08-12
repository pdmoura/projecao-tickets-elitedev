"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
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
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      menuButton?.focus();
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
        ref={menuButtonRef}
        type="button"
      >
        <span aria-hidden="true" className="relative grid size-5 place-items-center">
          <Menu className={`absolute size-5 transition duration-200 ${isOpen ? "scale-75 rotate-45 opacity-0" : "scale-100 opacity-100"}`} strokeWidth={1.8} />
          <X className={`absolute size-5 transition duration-200 ${isOpen ? "scale-100 opacity-100" : "scale-75 -rotate-45 opacity-0"}`} strokeWidth={1.8} />
        </span>
      </button>

      <div
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-50 bg-ink/45 backdrop-blur-[2px] transition-opacity duration-200 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setIsOpen(false)}
      >
        <aside
          aria-label="Navegação móvel"
          className={`fixed inset-y-0 right-0 flex h-[100dvh] w-[min(85vw,21.25rem)] flex-col overflow-y-auto border-l border-rule bg-paper px-7 py-7 shadow-2xl transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
          id={drawerId}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-rule pb-5">
            <p className="font-code text-sm font-medium uppercase tracking-[0.18em] text-ink">
              Navegação
            </p>
            <button
              aria-label="Fechar menu"
              className="grid size-10 place-items-center border border-rule text-ink transition hover:border-accent hover:bg-surface-secondary"
              onClick={() => setIsOpen(false)}
              ref={closeButtonRef}
              type="button"
            >
              <X aria-hidden="true" className="size-5" strokeWidth={1.8} />
            </button>
          </div>

          <nav className="mt-10 grid gap-2 text-center" aria-label="Links do menu">
            {primaryItems.map((item) => {
              const isActive = isActiveNavigationPath(pathname, item.href);

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`border-b border-rule px-3 py-4 font-display text-3xl transition-colors hover:text-accent ${isActive ? "text-ink underline decoration-accent decoration-2 underline-offset-8" : "text-ink"}`}
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
            <Link className="font-code text-xs uppercase tracking-[0.14em] text-ink hover:text-accent" href="/privacy" onClick={() => setIsOpen(false)}>Política de privacidade</Link>
            <Link className="font-code text-xs uppercase tracking-[0.14em] text-ink hover:text-accent" href="/terms" onClick={() => setIsOpen(false)}>Termos de uso</Link>
          </nav>
        </aside>
      </div>
    </div>
  );
}

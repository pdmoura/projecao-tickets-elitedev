"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [isRendered, setIsRendered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
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
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = drawerRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        );
        if (!focusableElements?.length) {
          return;
        }

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];
        if (!first || !last) {
          return;
        }

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
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

  function closeMenu() {
    setIsOpen(false);
  }

  function toggleMenu() {
    if (isOpen) {
      closeMenu();
      return;
    }

    setIsRendered(true);
    setIsOpen(true);
  }

  return (
    <>
      <div className="min-[501px]:hidden">
        <button
        aria-controls={drawerId}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        className="grid size-12 place-items-center bg-transparent text-ink transition hover:text-accent"
        onClick={toggleMenu}
        ref={menuButtonRef}
        type="button"
      >
        <span aria-hidden="true" className="relative grid size-5 place-items-center">
          <Menu className={`absolute size-7 transition duration-200 ${isOpen ? "scale-90 rotate-12 opacity-0" : "scale-100 opacity-100"}`} strokeWidth={1.8} />
          <X className={`absolute size-7 transition duration-200 ${isOpen ? "scale-100 opacity-100" : "scale-90 -rotate-12 opacity-0"}`} strokeWidth={1.8} />
        </span>
        </button>
      </div>

      {isRendered ? createPortal(<>
        <div
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-50 bg-ink/45 transition-opacity duration-200 min-[501px]:hidden ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={closeMenu}
        />
        <aside
        aria-label="Navegação móvel"
        aria-modal={isOpen || undefined}
        className={`fixed inset-y-0 right-0 z-[60] flex h-[100dvh] w-[min(86vw,21.25rem)] flex-col overflow-y-auto border-l border-rule bg-paper px-6 py-6 shadow-2xl transition-transform duration-300 ease-out min-[501px]:hidden motion-reduce:transition-none ${isOpen ? "pointer-events-auto translate-x-0" : "pointer-events-none translate-x-full"}`}
        id={drawerId}
        inert={!isOpen}
        onTransitionEnd={(event) => {
          if (!isOpen && event.propertyName === "transform") {
            setIsRendered(false);
          }
        }}
        ref={drawerRef}
        role="dialog"
        >
          <div className="flex items-center justify-between border-b border-rule pb-5">
            <p className="font-code text-sm font-medium uppercase tracking-[0.18em] text-ink">
              Navegação
            </p>
            <button
              aria-label="Fechar menu"
              className="grid size-11 place-items-center bg-transparent text-ink transition hover:text-accent"
              onClick={closeMenu}
              ref={closeButtonRef}
              type="button"
            >
              <X aria-hidden="true" className="size-7" strokeWidth={1.8} />
            </button>
          </div>

          <nav className="mt-10 grid gap-2 text-center" aria-label="Links do menu">
            {primaryItems.map((item) => {
              const isActive = isActiveNavigationPath(pathname, item.href);
              const className = `border-b border-rule px-3 py-4 font-display text-3xl transition-colors hover:text-accent ${isActive ? "text-ink underline decoration-accent decoration-2 underline-offset-8" : "text-ink"}`;

              if (item.href.includes("#")) {
                return (
                  <a
                    aria-current={isActive ? "page" : undefined}
                    className={className}
                    href={item.href}
                    key={item.href}
                    onClick={closeMenu}
                  >
                    {item.label}
                  </a>
                );
              }

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={className}
                  href={item.href}
                  key={item.href}
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              );
            })}
            {isAuthenticated ? (
              <div className="mt-4 flex justify-center">
                <LogoutButton onComplete={closeMenu} />
              </div>
            ) : null}
          </nav>

          <nav className="mt-auto grid gap-3 border-t border-rule pt-6 text-center" aria-label="Informações legais">
            <Link className="font-code text-xs uppercase tracking-[0.14em] text-ink hover:text-accent" href="/privacy" onClick={closeMenu}>Política de privacidade</Link>
            <Link className="font-code text-xs uppercase tracking-[0.14em] text-ink hover:text-accent" href="/terms" onClick={closeMenu}>Termos de uso</Link>
          </nav>
        </aside>
      </>, document.body) : null}
    </>
  );
}

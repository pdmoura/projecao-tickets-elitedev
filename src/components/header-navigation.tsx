"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type HeaderNavigationProps = {
  items: Array<{ href: string; label: string }>;
};

export function isActiveNavigationPath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/" || pathname.startsWith("/events/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderNavigation({ items }: HeaderNavigationProps) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
        const isActive = isActiveNavigationPath(pathname, item.href);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`font-code text-[0.68rem] font-medium uppercase tracking-[0.13em] underline decoration-accent underline-offset-4 transition-colors sm:text-xs ${
              isActive
                ? "text-ink decoration-[3px]"
                : "text-ink-muted decoration-1 hover:text-ink hover:decoration-2 hover:decoration-accent"
            }`}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

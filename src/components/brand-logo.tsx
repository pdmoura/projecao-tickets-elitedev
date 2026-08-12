"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";

type BrandLogoProps = {
  className?: string;
  inverse?: boolean;
  priority?: boolean;
};

export function BrandLogo({
  className,
  inverse = false,
  priority = false,
}: BrandLogoProps) {
  const pathname = usePathname();

  function returnToTop(event: MouseEvent<HTMLAnchorElement>) {
    if (pathname !== "/") {
      return;
    }

    event.preventDefault();
    window.scrollTo({ behavior: "smooth", top: 0 });
  }

  return (
    <Link
      aria-label="Ir para a página inicial"
      className="inline-flex shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      href="/"
      onClick={returnToTop}
    >
      <Image
        alt="Projeção"
        className={className}
        height={58}
        priority={priority}
        src={inverse ? "/brand/logo-inverse.svg" : "/brand/logo.svg"}
        width={184}
      />
    </Link>
  );
}

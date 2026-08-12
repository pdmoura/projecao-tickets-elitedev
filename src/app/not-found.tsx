import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-6 py-12 text-ink sm:px-10">
      <section className="w-full max-w-xl border-y border-rule py-10 text-center sm:py-14">
        <BrandLogo priority />
        <p className="mt-10 font-code text-xs uppercase tracking-[0.2em] text-accent">404 · Fora de cartaz</p>
        <h1 className="mt-4 font-display text-5xl leading-[0.95] sm:text-6xl">Esta sessão não está na programação.</h1>
        <p className="mx-auto mt-5 max-w-md leading-7 text-ink-muted">
          Talvez ela tenha mudado de endereço ou não esteja mais disponível.
        </p>
        <Link className="mt-8 inline-block bg-accent px-5 py-3 text-sm font-semibold hover:bg-accent-hover" href="/">
          Ver programação
        </Link>
      </section>
    </main>
  );
}

import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper px-6 py-8 text-ink sm:px-10 lg:px-16">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between border-b border-rule pb-5">
          <BrandLogo priority />
          <div className="flex items-center gap-5">
            <p className="font-code text-xs uppercase tracking-[0.18em] text-ink-muted">
              Cinema independente
            </p>
            <Link
              className="font-code text-xs font-medium uppercase tracking-[0.14em] text-ink underline decoration-accent decoration-2 underline-offset-4"
              href="/login"
            >
              Entrar
            </Link>
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center py-20">
          <p className="mb-5 font-code text-xs uppercase tracking-[0.22em] text-accent">
            Em preparação
          </p>
          <h1 className="max-w-3xl font-display text-5xl leading-[0.95] text-balance sm:text-6xl lg:text-7xl">
            Sessões que merecem sair da tela.
          </h1>
          <p className="mt-8 max-w-xl text-base leading-7 text-ink-muted sm:text-lg">
            A programação da Projeção está sendo preparada. Em breve, você
            poderá descobrir sessões especiais e guardar seus ingressos aqui.
          </p>
        </section>

        <footer className="flex flex-wrap justify-between gap-3 border-t border-rule pt-5 font-code text-xs uppercase tracking-[0.14em] text-ink-muted">
          <span>Projeção</span>
          <span>São Paulo, Brasil</span>
        </footer>
      </div>
    </main>
  );
}

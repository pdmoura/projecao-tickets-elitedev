import { AppHeader } from "./app-header";
import { HomeFooter } from "./home-footer";

type LegalSection = {
  body: string;
  title: string;
};

export async function LegalPage({
  eyebrow,
  intro,
  sections,
  title,
}: {
  eyebrow: string;
  intro: string;
  sections: LegalSection[];
  title: string;
}) {
  return (
    <main className="min-h-screen bg-paper px-6 text-ink sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[88rem]">
        <AppHeader />
        <article className="mx-auto max-w-3xl py-16 sm:py-24">
          <p className="inline-flex bg-ink px-3 py-1.5 font-code text-[0.7rem] font-medium uppercase tracking-[0.14em] text-accent">
            {eyebrow}
          </p>
          <h1 className="mt-5 font-display text-5xl leading-[0.95] text-balance sm:text-6xl">
            {title}
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-ink-muted">{intro}</p>
          <div className="mt-14 grid gap-10 border-t border-rule pt-10 sm:mt-16 sm:gap-12">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-display text-3xl leading-tight sm:text-4xl">{section.title}</h2>
                <p className="mt-4 max-w-2xl leading-7 text-ink-muted">{section.body}</p>
              </section>
            ))}
          </div>
        </article>
      </div>
      <HomeFooter />
    </main>
  );
}

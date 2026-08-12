import Link from "next/link";

import { BrandLogo } from "./brand-logo";

type SocialLink = {
  label: string;
  path: string;
};

const socialLinks: readonly SocialLink[] = [
  { label: "Instagram", path: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5Zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5Zm5.25-3.6a1.1 1.1 0 1 1-1.1 1.1 1.1 1.1 0 0 1 1.1-1.1Z" },
  { label: "X", path: "M4 3h4.5l4.1 5.5L17.2 3H20l-6.1 7.1L20.5 21H16l-4.5-6-5.1 6H3.5l6.7-7.7L3.5 3H8l4 5.4L16.6 3H4Zm4.9 2 7.5 14h1.7l-7.5-14H8.9Z" },
  { label: "YouTube", path: "M21.4 7.2a2.8 2.8 0 0 0-2-2C17.6 4.7 12 4.7 12 4.7s-5.6 0-7.4.5a2.8 2.8 0 0 0-2 2C2.1 9 2.1 12 2.1 12s0 3 .5 4.8a2.8 2.8 0 0 0 2 2c1.8.5 7.4.5 7.4.5s5.6 0 7.4-.5a2.8 2.8 0 0 0 2-2c.5-1.8.5-4.8.5-4.8s0-3-.5-4.8ZM10 15.8V8.2l6 3.8-6 3.8Z" },
  { label: "Letterboxd", path: "M4 8.5h16v7H4v-7Zm3.5 0a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm4.5 0a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm4.5 0a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" },
  { label: "WhatsApp", path: "M12 2a10 10 0 0 0-8.5 15.3L2 22l4.9-1.5A10 10 0 1 0 12 2Zm0 18.2a8.1 8.1 0 0 1-4.1-1.1l-.3-.2-2.9.9.9-2.8-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.3-.6.8-.8 1-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-2-1.2 7.5 7.5 0 0 1-1.4-1.8c-.1-.2 0-.4.1-.5l.4-.5c.1-.1.1-.3.2-.4 0-.2 0-.3-.1-.4l-.8-1.8c-.2-.5-.5-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.2s.9 2.5 1 2.7a9.4 9.4 0 0 0 3.7 3.3c.5.2.9.4 1.3.5.5.2 1 .2 1.4.1.4-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2-.1-.1-.3-.2-.5-.3Z" },
];

export function HomeFooter() {
  return (
    <footer className="-mx-6 mt-8 bg-ink px-6 py-11 text-paper sm:-mx-10 sm:px-10 sm:py-14 lg:-mx-16 lg:px-16">
      <div className="mx-auto max-w-[88rem]">
        <div className="flex flex-col items-center gap-9 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div className="max-w-xl">
            <BrandLogo className="h-auto w-52 sm:w-44" inverse />
            <p className="mt-6 max-w-lg font-display text-2xl leading-tight text-paper sm:text-3xl">
              Cinema que acontece: programação, lugar e encontro em uma mesma sala.
            </p>
          </div>
          <div aria-label="Redes sociais" className="flex flex-wrap items-center justify-center gap-3">
            {socialLinks.map((socialLink) => (
              <a
                aria-label={socialLink.label}
                className="grid size-11 place-items-center border border-paper/30 text-paper transition duration-200 hover:border-accent hover:bg-accent hover:text-ink focus-visible:border-accent sm:size-12"
                href="#"
                key={socialLink.label}
              >
                <svg aria-hidden="true" className="size-6 fill-current" viewBox="0 0 24 24">
                  <path d={socialLink.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center gap-3 border-t border-paper/20 pt-5 text-center font-code text-[0.68rem] uppercase tracking-[0.13em] text-paper/65 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>
            © 2026 Todos os direitos reservados —{" "}
            <Link
              className="text-paper underline decoration-accent decoration-2 underline-offset-4 transition-colors hover:text-accent"
              href="https://wa.link/tayfn7"
              rel="noreferrer"
              target="_blank"
            >
              Pedro Alves
            </Link>
          </p>
          <p>Programação independente em tela grande.</p>
        </div>
      </div>
    </footer>
  );
}

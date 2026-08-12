"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "./client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await authClient.signIn.email({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      rememberMe: true,
    });

    if (response.error) {
      setError("E-mail ou senha inválidos. Tente novamente.");
      setIsSubmitting(false);
      return;
    }

    router.push("/login/redirect");
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-ink" htmlFor="email">
        E-mail
        <input
          autoComplete="email"
          className="mt-2 block w-full rounded-sm border border-rule bg-surface px-3 py-3 text-base text-ink shadow-sm"
          id="email"
          name="email"
          required
          type="email"
        />
      </label>

      <label className="block text-sm font-medium text-ink" htmlFor="password">
        Senha
        <span className="relative mt-2 block">
          <input
            autoComplete="current-password"
            className="block w-full rounded-sm border border-rule bg-surface px-3 py-3 pr-12 text-base text-ink shadow-sm"
            id="password"
            minLength={12}
            name="password"
            required
            type={isPasswordVisible ? "text" : "password"}
          />
          <button
            aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ink-muted transition-colors hover:text-ink"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            type="button"
          >
            {isPasswordVisible ? (
              <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="m3 3 18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.9 4.3A10.6 10.6 0 0 1 12 4c5.5 0 9.3 5.2 9.3 8s-1.4 4.7-3.6 6.1" />
                <path d="M6.2 6.2C4 7.7 2.7 10 2.7 12c0 2.8 3.8 8 9.3 8 1.3 0 2.5-.3 3.6-.8" />
              </svg>
            ) : (
              <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M2.7 12S6.5 4 12 4s9.3 8 9.3 8-3.8 8-9.3 8-9.3-8-9.3-8Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </span>
      </label>

      {error ? (
        <p aria-live="polite" className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}

      <button
        className="w-full rounded-sm bg-ink px-4 py-3 font-code text-sm font-medium uppercase tracking-[0.14em] text-paper transition hover:bg-ink-muted disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

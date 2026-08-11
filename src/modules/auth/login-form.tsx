"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "./client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        <input
          autoComplete="current-password"
          className="mt-2 block w-full rounded-sm border border-rule bg-surface px-3 py-3 text-base text-ink shadow-sm"
          id="password"
          minLength={12}
          name="password"
          required
          type="password"
        />
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "./client";

export function LogoutButton({
  inverse = false,
  onComplete,
}: {
  inverse?: boolean;
  onComplete?: () => void;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    await authClient.signOut();
    onComplete?.();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      className={`font-code text-xs font-medium uppercase tracking-[0.14em] underline decoration-accent decoration-2 underline-offset-4 disabled:opacity-60 ${inverse ? "text-gate-text" : "text-ink"}`}
      disabled={isSubmitting}
      onClick={handleLogout}
      type="button"
    >
      {isSubmitting ? "Saindo…" : "Sair"}
    </button>
  );
}

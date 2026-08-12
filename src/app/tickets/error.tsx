"use client";

import { RouteError } from "@/components/route-error";

export default function TicketsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError reset={reset} returnHref="/tickets" returnLabel="Voltar aos ingressos" title="Não foi possível abrir seus ingressos" />;
}

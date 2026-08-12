"use client";

import { RouteError } from "@/components/route-error";

export default function EventError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError reset={reset} title="Não foi possível abrir esta sessão" />;
}

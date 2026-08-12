"use client";

import { RouteError } from "@/components/route-error";

export default function OrganizerError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError reset={reset} returnHref="/organizer" returnLabel="Voltar às sessões" title="Não foi possível abrir suas sessões" />;
}

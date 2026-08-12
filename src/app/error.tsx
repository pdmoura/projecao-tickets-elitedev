"use client";

import { RouteError } from "@/components/route-error";

export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError reset={reset} />;
}

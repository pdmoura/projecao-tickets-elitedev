export function formatCurrency(priceCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(priceCents / 100);
}

export function formatEventDate(startsAt: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(startsAt));
}

export function formatReleaseYear(releaseDate: string | null): string | null {
  return releaseDate ? String(new Date(releaseDate).getUTCFullYear()) : null;
}

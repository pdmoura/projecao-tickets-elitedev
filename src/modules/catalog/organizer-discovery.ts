import type { CatalogDiscoverInput, CatalogDiscoverSort } from "./catalog.types";

export const organizerDiscoverSortOptions: ReadonlyArray<{
  label: string;
  value: CatalogDiscoverSort;
}> = [
  { label: "Mais populares", value: "popularity" },
  { label: "Melhor avaliados", value: "rating" },
  { label: "Mais recentes", value: "releaseDate" },
  { label: "A–Z", value: "titleAsc" },
  { label: "Z–A", value: "titleDesc" },
];

export function createDiscoverCacheKey(input: CatalogDiscoverInput): string {
  return [
    input.page,
    input.genreId ?? "all",
    input.year ?? "all",
    input.sort,
  ].join(":");
}

export function resetDiscoverPage(
  input: CatalogDiscoverInput,
  changes: Partial<Omit<CatalogDiscoverInput, "page">>,
): CatalogDiscoverInput {
  return { ...input, ...changes, page: 1 };
}

export function getOrganizerDiscoveryYears(currentYear = new Date().getUTCFullYear()): number[] {
  return Array.from({ length: 8 }, (_, index) => currentYear - index);
}

export function getCompactPageNumbers(currentPage: number, totalPages: number): number[] {
  const lastPage = Math.max(1, totalPages);
  const firstPage = Math.max(1, Math.min(currentPage - 1, lastPage - 4));
  const finalPage = Math.min(lastPage, Math.max(firstPage + 4, currentPage + 1));

  return Array.from({ length: finalPage - firstPage + 1 }, (_, index) => firstPage + index);
}

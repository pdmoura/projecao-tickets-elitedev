export function getVenueSuggestions(
  venues: Array<string | null | undefined>,
): string[] {
  return [
    ...new Set(
      venues
        .filter((venue): venue is string => Boolean(venue?.trim()))
        .map((venue) => venue.trim()),
    ),
  ].sort((first, second) => first.localeCompare(second, "pt-BR"));
}

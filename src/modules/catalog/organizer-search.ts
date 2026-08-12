export const minimumCatalogQueryLength = 2;

export function normalizeCatalogQuery(query: string): string {
  return query.trim().toLocaleLowerCase("pt-BR");
}

export function canSearchCatalog(query: string): boolean {
  return normalizeCatalogQuery(query).length >= minimumCatalogQueryLength;
}

export function createSearchRequestTracker() {
  let currentRequestId = 0;

  return {
    begin() {
      currentRequestId += 1;

      return currentRequestId;
    },
    isCurrent(requestId: number) {
      return requestId === currentRequestId;
    },
  };
}

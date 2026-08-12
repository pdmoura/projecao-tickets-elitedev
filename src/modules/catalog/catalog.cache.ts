import "server-only";

import { unstable_cache } from "next/cache";

export const catalogCacheTtl = {
  details: 86_400,
  discover: 900,
  genres: 86_400,
  search: 600,
  trending: 3_600,
  videos: 86_400,
} as const;

export type CatalogCache = {
  getOrSet<T>(
    keyParts: readonly string[],
    revalidateSeconds: number,
    loader: () => Promise<T>,
  ): Promise<T>;
};

export const nextCatalogCache: CatalogCache = {
  getOrSet(keyParts, revalidateSeconds, loader) {
    return unstable_cache(loader, [...keyParts], {
      revalidate: revalidateSeconds,
    })();
  },
};

export function createMemoryCatalogCache(): CatalogCache {
  const entries = new Map<string, Promise<unknown>>();

  return {
    async getOrSet(keyParts, _revalidateSeconds, loader) {
      const key = keyParts.join("\u0000");
      const cached = entries.get(key);

      if (cached) {
        return cached as Promise<Awaited<ReturnType<typeof loader>>>;
      }

      const pending = loader();
      entries.set(key, pending);

      try {
        return await pending;
      } catch (error) {
        entries.delete(key);
        throw error;
      }
    },
  };
}

import "server-only";

import { getServerEnv } from "@/lib/env/server";

import { CatalogUnavailableError } from "./catalog.errors";

const tmdbBaseUrl = "https://api.themoviedb.org/3";
const defaultTimeoutMs = 8_000;

export type TmdbClient = {
  get(path: string, searchParams?: Record<string, string>): Promise<unknown>;
};

type TmdbClientOptions = {
  accessToken?: string;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
};

export function createTmdbClient(options: TmdbClientOptions = {}): TmdbClient {
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs;

  return {
    async get(path, searchParams = {}) {
      const url = new URL(`${tmdbBaseUrl}${path}`);

      for (const [key, value] of Object.entries(searchParams)) {
        url.searchParams.set(key, value);
      }

      try {
        const response = await (options.fetchFn ?? fetch)(url, {
          cache: "no-store",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${options.accessToken ?? getServerEnv().TMDB_ACCESS_TOKEN}`,
          },
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (!response.ok) {
          throw new CatalogUnavailableError();
        }

        return await response.json();
      } catch (error) {
        if (error instanceof CatalogUnavailableError) {
          throw error;
        }

        throw new CatalogUnavailableError();
      }
    },
  };
}

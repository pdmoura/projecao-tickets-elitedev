import "server-only";

import { getServerEnv } from "@/lib/env/server";

import { CatalogUnavailableError } from "./catalog.errors";

const tmdbBaseUrl = "https://api.themoviedb.org/3";
const defaultTimeoutMs = 8_000;
const defaultRetryDelayMs = 250;
const maximumRetryAfterMs = 1_000;
const retryableStatuses = new Set([429, 500, 502, 503, 504]);

type TmdbLogger = {
  info?(message: string): void;
  warn(message: string): void;
};

type TmdbRequestOptions = {
  operation?: "details" | "search" | "videos";
};

export type TmdbClient = {
  get(
    path: string,
    searchParams?: Record<string, string>,
    options?: TmdbRequestOptions,
  ): Promise<unknown>;
};

type TmdbClientOptions = {
  accessToken?: string;
  fetchFn?: typeof fetch;
  logger?: TmdbLogger;
  retryDelayMs?: number;
  searchRetryDelaysMs?: readonly number[];
  sleepFn?: (milliseconds: number) => Promise<void>;
  timeoutMs?: number;
};

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function getRetryDelayMs(response: Response | null, fallbackMs: number): number {
  const retryAfter = response?.headers.get("retry-after")?.trim();

  if (!retryAfter) {
    return fallbackMs;
  }

  const seconds = Number(retryAfter);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * 1_000, maximumRetryAfterMs);
  }

  const retryAt = Date.parse(retryAfter);

  return Number.isNaN(retryAt)
    ? fallbackMs
    : Math.min(Math.max(retryAt - Date.now(), 0), maximumRetryAfterMs);
}

function isTimeout(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

export function createTmdbClient(options: TmdbClientOptions = {}): TmdbClient {
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
  const retryDelayMs = options.retryDelayMs ?? defaultRetryDelayMs;
  const searchRetryDelaysMs = options.searchRetryDelaysMs ?? [300, 700];
  const logger = options.logger ?? console;
  const sleep = options.sleepFn ?? delay;
  let hasLoggedConfiguration = false;

  return {
    async get(path, searchParams = {}, requestOptions = {}) {
      const url = new URL(`${tmdbBaseUrl}${path}`);
      const operation = requestOptions.operation ?? "details";
      const retryDelaysMs =
        operation === "search" ? searchRetryDelaysMs : [retryDelayMs];
      const maximumAttempts = retryDelaysMs.length + 1;

      for (const [key, value] of Object.entries(searchParams)) {
        url.searchParams.set(key, value);
      }

      if (!hasLoggedConfiguration) {
        logger.info?.(
          `TMDB_ACCESS_TOKEN configured=${Boolean(options.accessToken ?? process.env.TMDB_ACCESS_TOKEN?.trim())}`,
        );
        hasLoggedConfiguration = true;
      }

      const accessToken = options.accessToken ?? getServerEnv().TMDB_ACCESS_TOKEN;

      for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
        try {
          const response = await (options.fetchFn ?? fetch)(url, {
            cache: "no-store",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            signal: AbortSignal.timeout(timeoutMs),
          });

          if (response.ok) {
            if (attempt > 0) {
              logger.info?.(
                `TMDb request recovered operation=${operation} attempt=${attempt + 1}/${maximumAttempts}`,
              );
            }

            return await response.json();
          }

          logger.warn(
            `TMDb request failed operation=${operation} path=${path} attempt=${attempt + 1}/${maximumAttempts} status=${response.status}`,
          );

          if (!retryableStatuses.has(response.status) || attempt === maximumAttempts - 1) {
            throw new CatalogUnavailableError();
          }

          await sleep(getRetryDelayMs(response, retryDelaysMs[attempt] ?? retryDelayMs));
        } catch (error) {
          if (error instanceof CatalogUnavailableError) {
            throw error;
          }

          logger.warn(
            `TMDb request failed operation=${operation} path=${path} attempt=${attempt + 1}/${maximumAttempts} reason=${isTimeout(error) ? "timeout" : "network_error"}`,
          );

          if (attempt === maximumAttempts - 1) {
            throw new CatalogUnavailableError();
          }

          await sleep(retryDelaysMs[attempt] ?? retryDelayMs);
        }

      }

      throw new CatalogUnavailableError();
    },
  };
}

import "server-only";

import type {
  CatalogMovie,
  CatalogMovieDetails,
  CatalogMovieVideos,
  CatalogSearchResult,
  CatalogTrailer,
} from "./catalog.types";
import { CatalogUnavailableError } from "./catalog.errors";
import { createTmdbClient, type TmdbClient } from "./tmdb.client";

const tmdbImageBaseUrl = "https://image.tmdb.org/t/p/w500";
const posterFallbackUrl = "/placeholders/poster-unavailable.png";

type TmdbMovie = {
  backdrop_path?: unknown;
  genres?: unknown;
  id?: unknown;
  overview?: unknown;
  poster_path?: unknown;
  release_date?: unknown;
  runtime?: unknown;
  title?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asMovie(value: unknown): TmdbMovie | null {
  return isRecord(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asPositiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : null;
}

function imageUrl(path: unknown, fallback: string | null): string | null {
  const imagePath = asString(path);

  return imagePath?.startsWith("/") ? `${tmdbImageBaseUrl}${imagePath}` : fallback;
}

function normalizeMovie(value: unknown): CatalogMovie {
  const movie = asMovie(value);
  const externalId = asPositiveInteger(movie?.id);
  const title = asString(movie?.title)?.trim();

  if (!movie || !externalId || !title) {
    throw new CatalogUnavailableError();
  }

  return {
    externalId,
    overview: asString(movie.overview) ?? "",
    posterUrl: imageUrl(movie.poster_path, posterFallbackUrl) ?? posterFallbackUrl,
    releaseDate: asString(movie.release_date),
    title,
  };
}

function normalizeGenres(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((genre) => {
    const name = isRecord(genre) ? asString(genre.name)?.trim() : null;

    return name ? [name] : [];
  });
}

function normalizeMovieDetails(value: unknown): CatalogMovieDetails {
  const movie = asMovie(value);

  if (!movie) {
    throw new CatalogUnavailableError();
  }

  return {
    ...normalizeMovie(movie),
    backdropUrl: imageUrl(movie.backdrop_path, null),
    genres: normalizeGenres(movie.genres),
    runtimeMinutes: asPositiveInteger(movie.runtime),
  };
}

function languageRank(language: unknown): number {
  switch (language) {
    case "pt":
    case "pt-BR":
      return 0;
    case "en":
    case "en-US":
      return 1;
    default:
      return 2;
  }
}

function normalizeTrailer(value: unknown): CatalogTrailer | null {
  if (!isRecord(value) || value.site !== "YouTube" || value.type !== "Trailer") {
    return null;
  }

  const key = asString(value.key)?.trim();
  const name = asString(value.name)?.trim();

  return key && name ? { key, name, site: "YouTube" } : null;
}

function selectTrailer(videos: unknown): CatalogTrailer | null {
  if (!Array.isArray(videos)) {
    return null;
  }

  const candidates = videos
    .map((video) => ({ raw: video, trailer: normalizeTrailer(video) }))
    .filter(
      (candidate): candidate is { raw: Record<string, unknown>; trailer: CatalogTrailer } =>
        candidate.trailer !== null && isRecord(candidate.raw),
    )
    .sort((left, right) => {
      const officialDifference =
        Number(right.raw.official === true) - Number(left.raw.official === true);

      if (officialDifference !== 0) {
        return officialDifference;
      }

      const languageDifference =
        languageRank(left.raw.iso_639_1) - languageRank(right.raw.iso_639_1);

      if (languageDifference !== 0) {
        return languageDifference;
      }

      const publicationDifference = String(right.raw.published_at ?? "").localeCompare(
        String(left.raw.published_at ?? ""),
      );

      return publicationDifference !== 0
        ? publicationDifference
        : left.trailer.key.localeCompare(right.trailer.key);
    });

  return candidates[0]?.trailer ?? null;
}

export function createCatalogService(client: TmdbClient = createTmdbClient()) {
  return {
    async searchMovies(query: string, page = 1): Promise<CatalogSearchResult> {
      const response = await client.get("/search/movie", {
        include_adult: "false",
        language: "pt-BR",
        page: String(page),
        query,
      });

      if (!isRecord(response) || !Array.isArray(response.results)) {
        throw new CatalogUnavailableError();
      }

      const returnedPage = asPositiveInteger(response.page) ?? page;
      const totalPages = asPositiveInteger(response.total_pages) ?? 0;

      return {
        items: response.results.map(normalizeMovie),
        page: returnedPage,
        totalPages,
      };
    },

    async getMovieDetails(movieId: number): Promise<CatalogMovieDetails> {
      const response = await client.get(`/movie/${movieId}`, { language: "pt-BR" });

      return normalizeMovieDetails(response);
    },

    async getMovieVideos(movieId: number): Promise<CatalogMovieVideos> {
      const response = await client.get(`/movie/${movieId}/videos`, {
        language: "pt-BR",
      });

      if (!isRecord(response)) {
        throw new CatalogUnavailableError();
      }

      return { trailer: selectTrailer(response.results) };
    },
  };
}

const catalogService = createCatalogService();

export const searchMovies = catalogService.searchMovies;
export const getMovieDetails = catalogService.getMovieDetails;
export const getMovieVideos = catalogService.getMovieVideos;

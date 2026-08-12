import "server-only";

import type {
  CatalogMovie,
  CatalogSearchFilters,
  CatalogDiscoverInput,
  CatalogDiscoverResult,
  CatalogDiscoveryMovie,
  CatalogGenre,
  CatalogMovieDetails,
  CatalogMovieVideos,
  CatalogSearchResult,
  CatalogTrailer,
} from "./catalog.types";
import { CatalogUnavailableError } from "./catalog.errors";
import {
  catalogCacheTtl,
  createMemoryCatalogCache,
  nextCatalogCache,
  type CatalogCache,
} from "./catalog.cache";
import { createTmdbClient, type TmdbClient } from "./tmdb.client";

const tmdbImageBaseUrl = "https://image.tmdb.org/t/p/w500";
const posterFallbackUrl = "/placeholders/poster-unavailable.png";
const discoveryPageSize = 10;
const ratingVoteThreshold = 100;
const catalogLanguage = "pt-BR";

const discoverSortParameters = {
  popularity: "popularity.desc",
  rating: "vote_average.desc",
  releaseDate: "primary_release_date.desc",
  titleAsc: "title.asc",
  titleDesc: "title.desc",
} as const;

type TmdbMovie = {
  backdrop_path?: unknown;
  genres?: unknown;
  genre_ids?: unknown;
  id?: unknown;
  overview?: unknown;
  poster_path?: unknown;
  popularity?: unknown;
  release_date?: unknown;
  runtime?: unknown;
  title?: unknown;
  vote_average?: unknown;
  vote_count?: unknown;
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

function normalizeDiscoveryMovie(value: unknown): CatalogDiscoveryMovie {
  const movie = asMovie(value);
  const voteAverage = typeof movie?.vote_average === "number" && Number.isFinite(movie.vote_average)
    ? movie.vote_average
    : null;

  return { ...normalizeMovie(value), rating: voteAverage };
}

function getMovieGenreIds(value: unknown): number[] {
  const movie = asMovie(value);

  return Array.isArray(movie?.genre_ids)
    ? movie.genre_ids.flatMap((genreId) => asPositiveInteger(genreId) ?? [])
    : [];
}

function compareSearchMovies(
  left: unknown,
  right: unknown,
  sort: CatalogSearchFilters["sort"],
): number {
  const leftMovie = asMovie(left);
  const rightMovie = asMovie(right);
  const text = (value: unknown) => asString(value)?.trim() ?? "";
  const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : 0;
  const descending = (leftValue: number, rightValue: number) => rightValue - leftValue;

  const difference = (() => {
    switch (sort) {
      case "rating":
        return descending(number(leftMovie?.vote_average), number(rightMovie?.vote_average));
      case "releaseDate":
        return text(rightMovie?.release_date).localeCompare(text(leftMovie?.release_date));
      case "titleAsc":
        return text(leftMovie?.title).localeCompare(text(rightMovie?.title), "pt-BR");
      case "titleDesc":
        return text(rightMovie?.title).localeCompare(text(leftMovie?.title), "pt-BR");
      case "popularity":
        return descending(number(leftMovie?.popularity), number(rightMovie?.popularity));
    }
  })();

  return difference || (asPositiveInteger(leftMovie?.id) ?? 0) - (asPositiveInteger(rightMovie?.id) ?? 0);
}

function normalizeCatalogGenre(value: unknown): CatalogGenre | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = asPositiveInteger(value.id);
  const name = asString(value.name)?.trim();

  return id && name ? { id, name } : null;
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

function getSearchCacheKey(query: string, page: number, filters: CatalogSearchFilters): string[] {
  return [
    "catalog",
    "search",
    catalogLanguage,
    normalizeCatalogQuery(query),
    String(page),
    filters.genreId === null ? "all" : String(filters.genreId),
    filters.year === null ? "all" : String(filters.year),
    filters.sort,
  ];
}

function normalizeCatalogQuery(query: string): string {
  return query.trim().toLocaleLowerCase("pt-BR");
}

function getDiscoverCacheKey(input: CatalogDiscoverInput): string[] {
  return [
    "catalog",
    "discover",
    catalogLanguage,
    String(input.page),
    input.genreId === null ? "all" : String(input.genreId),
    input.year === null ? "all" : String(input.year),
    input.sort,
  ];
}

export function createCatalogService(
  client: TmdbClient = createTmdbClient(),
  cache: CatalogCache = process.env.NODE_ENV === "test"
    ? createMemoryCatalogCache()
    : nextCatalogCache,
) {
  const loadDiscoverMovies = async (input: CatalogDiscoverInput): Promise<CatalogDiscoverResult> => {
    const tmdbPage = Math.ceil(input.page / 2);
    const response = await client.get("/discover/movie", {
      include_adult: "false",
      language: catalogLanguage,
      page: String(tmdbPage),
      ...(input.genreId ? { with_genres: String(input.genreId) } : {}),
      ...(input.year ? { primary_release_year: String(input.year) } : {}),
      ...(input.sort === "rating" ? { "vote_count.gte": String(ratingVoteThreshold) } : {}),
      sort_by: discoverSortParameters[input.sort],
    }, { operation: "search" });

    if (!isRecord(response) || !Array.isArray(response.results)) {
      throw new CatalogUnavailableError();
    }

    const totalResults = asPositiveInteger(response.total_results) ?? 0;
    const start = input.page % 2 === 0 ? discoveryPageSize : 0;

    return {
      items: response.results.slice(start, start + discoveryPageSize).map(normalizeDiscoveryMovie),
      page: input.page,
      totalPages: Math.ceil(totalResults / discoveryPageSize),
    };
  };

  const getCachedDiscoverMovies = (input: CatalogDiscoverInput) =>
    cache.getOrSet(
      getDiscoverCacheKey(input),
      catalogCacheTtl.discover,
      () => loadDiscoverMovies(input),
    );

  return {
    async searchMovies(
      query: string,
      page = 1,
      filters: CatalogSearchFilters = { genreId: null, sort: "popularity", year: null },
    ): Promise<CatalogSearchResult> {
      return cache.getOrSet(getSearchCacheKey(query, page, filters), catalogCacheTtl.search, async () => {
      const searchPage = async (tmdbPage: number) => client.get("/search/movie", {
        include_adult: "false",
        language: catalogLanguage,
        page: String(tmdbPage),
        ...(filters.year ? { primary_release_year: String(filters.year) } : {}),
        query,
      }, { operation: "search" });
      const needsCompleteResultSet = filters.genreId !== null || filters.sort !== "popularity";
      const initialTmdbPage = needsCompleteResultSet ? 1 : page;
      const response = await searchPage(initialTmdbPage);

      if (!isRecord(response) || !Array.isArray(response.results)) {
        throw new CatalogUnavailableError();
      }

      if (!needsCompleteResultSet) {
        const returnedPage = asPositiveInteger(response.page) ?? page;
        const totalPages = asPositiveInteger(response.total_pages) ?? 0;
        const items = [...response.results]
          .sort((left, right) => compareSearchMovies(left, right, filters.sort))
          .map(normalizeMovie);

        return { items, page: returnedPage, totalPages };
      }

      const totalTmdbPages = asPositiveInteger(response.total_pages) ?? 1;
      const additionalPages = await Promise.all(
        Array.from({ length: Math.max(0, totalTmdbPages - 1) }, (_, index) => searchPage(index + 2)),
      );
      const movies = [response, ...additionalPages].flatMap((result) =>
        isRecord(result) && Array.isArray(result.results) ? result.results : [],
      );
      const filteredMovies = movies
        .filter((movie) => !filters.genreId || getMovieGenreIds(movie).includes(filters.genreId))
        .filter((movie) => filters.sort !== "rating" || (asPositiveInteger(asMovie(movie)?.vote_count) ?? 0) >= ratingVoteThreshold)
        .sort((left, right) => compareSearchMovies(left, right, filters.sort));
      const start = (page - 1) * discoveryPageSize;

      return {
        items: filteredMovies.slice(start, start + discoveryPageSize).map(normalizeMovie),
        page,
        totalPages: Math.ceil(filteredMovies.length / discoveryPageSize),
      };
      });
    },

    async getMovieDetails(movieId: number): Promise<CatalogMovieDetails> {
      return cache.getOrSet(["catalog", "details", catalogLanguage, String(movieId)], catalogCacheTtl.details, async () => {
      const response = await client.get(
        `/movie/${movieId}`,
        { language: catalogLanguage },
        { operation: "details" },
      );

      return normalizeMovieDetails(response);
      });
    },

    async getMovieVideos(movieId: number): Promise<CatalogMovieVideos> {
      return cache.getOrSet(["catalog", "videos", catalogLanguage, String(movieId)], catalogCacheTtl.videos, async () => {
      const response = await client.get(`/movie/${movieId}/videos`, {
        language: catalogLanguage,
      }, { operation: "videos" });

      if (!isRecord(response)) {
        throw new CatalogUnavailableError();
      }

      return { trailer: selectTrailer(response.results) };
      });
    },

    async getTrendingMovies(): Promise<CatalogDiscoveryMovie[]> {
      return cache.getOrSet(["catalog", "trending", catalogLanguage, "week"], catalogCacheTtl.trending, async () => {
      const response = await client.get("/trending/movie/week", { language: "pt-BR" }, { operation: "search" });

      if (!isRecord(response) || !Array.isArray(response.results)) {
        throw new CatalogUnavailableError();
      }

      return response.results.slice(0, discoveryPageSize).map(normalizeDiscoveryMovie);
      });
    },

    async listGenres(): Promise<CatalogGenre[]> {
      return cache.getOrSet(["catalog", "genres", catalogLanguage], catalogCacheTtl.genres, async () => {
      const response = await client.get("/genre/movie/list", { language: "pt-BR" }, { operation: "search" });

      if (!isRecord(response) || !Array.isArray(response.genres)) {
        throw new CatalogUnavailableError();
      }

      return response.genres
        .map(normalizeCatalogGenre)
        .filter((genre): genre is CatalogGenre => genre !== null)
        .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
      });
    },

    async discoverMovies(input: CatalogDiscoverInput): Promise<CatalogDiscoverResult> {
      const result = await getCachedDiscoverMovies(input);

      if (result.page < result.totalPages) {
        void getCachedDiscoverMovies({ ...input, page: input.page + 1 }).catch(() => undefined);
      }

      return result;
    },
  };
}

const catalogService = createCatalogService();

export const searchMovies = catalogService.searchMovies;
export const getMovieDetails = catalogService.getMovieDetails;
export const getMovieVideos = catalogService.getMovieVideos;
export const getTrendingMovies = catalogService.getTrendingMovies;
export const listGenres = catalogService.listGenres;
export const discoverMovies = catalogService.discoverMovies;

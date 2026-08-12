import { describe, expect, it, vi } from "vitest";

import { GET as searchMoviesRoute } from "@/app/api/catalog/movies/route";
import { GET as discoverMoviesRoute } from "@/app/api/catalog/discover/route";
import { GET as genresRoute } from "@/app/api/catalog/genres/route";
import { GET as trendingMoviesRoute } from "@/app/api/catalog/trending/route";
import { CatalogUnavailableError } from "@/modules/catalog/catalog.errors";
import { createMemoryCatalogCache } from "@/modules/catalog/catalog.cache";
import { createCatalogService } from "@/modules/catalog/catalog.service";
import { createTmdbClient } from "@/modules/catalog/tmdb.client";

const authMocks = vi.hoisted(() => {
  class AuthenticationError extends Error {
    readonly code = "AUTH_REQUIRED";
    readonly status = 401;
  }

  class AuthorizationError extends Error {
    readonly code = "FORBIDDEN";
    readonly status = 403;

    constructor() {
      super("Você não tem permissão para realizar esta ação.");
    }
  }

  return {
    AuthenticationError,
    AuthorizationError,
    requireRole: vi.fn(),
  };
});

const catalogRouteMocks = vi.hoisted(() => {
  class CatalogUnavailableError extends Error {
    readonly code = "CATALOG_UNAVAILABLE";
    readonly status = 503;
  }

  class CatalogValidationError extends Error {
    readonly code = "VALIDATION_ERROR";
    readonly status = 400;
  }

  return {
    CatalogUnavailableError,
    CatalogValidationError,
    discoverMovies: vi.fn(),
    getMovieDetails: vi.fn(),
    getMovieVideos: vi.fn(),
    getTrendingMovies: vi.fn(),
    listGenres: vi.fn(),
    searchMovies: vi.fn(),
  };
});

vi.mock("@/modules/auth", () => authMocks);
vi.mock("@/modules/catalog", () => catalogRouteMocks);

type FetchMock = ReturnType<
  typeof vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>
>;

function createFetchMock(response: Response): FetchMock {
  return vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>().mockResolvedValue(
    response,
  );
}

function getFetchCall(mock: FetchMock) {
  const call = mock.mock.calls.at(0);

  if (!call) {
    throw new Error("Expected a TMDb request.");
  }

  return call;
}

function catalogWithResponse(response: Response) {
  const fetchMock = createFetchMock(response);
  const client = createTmdbClient({
    accessToken: "tmdb-test-token",
    fetchFn: fetchMock,
  });

  return { catalog: createCatalogService(client), fetchMock };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  });
}

function testLogger() {
  return { info: vi.fn(), warn: vi.fn() };
}

function discoveryMovies(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    overview: `Sinopse ${index + 1}`,
    poster_path: index === 0 ? null : `/poster-${index + 1}.jpg`,
    release_date: `202${index % 6}-01-01`,
    title: `Filme ${index + 1}`,
    vote_average: 7.5,
  }));
}

describe("TMDb catalog", () => {
  it("reuses successful discover responses by complete key and prefetches only the next page", async () => {
    const fetchMock = vi
      .fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockImplementation(async () => jsonResponse({ results: discoveryMovies(20), total_results: 45 }));
    const catalog = createCatalogService(
      createTmdbClient({ accessToken: "tmdb-test-token", fetchFn: fetchMock }),
      createMemoryCatalogCache(),
    );
    const input = { genreId: 18, page: 1, sort: "popularity" as const, year: 2024 };

    await expect(catalog.discoverMovies(input)).resolves.toMatchObject({ page: 1 });
    await expect(catalog.discoverMovies(input)).resolves.toMatchObject({ page: 1 });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new URL(String(fetchMock.mock.calls[0]?.[0])).searchParams.get("page")).toBe("1");
  });

  it("keeps filters and pages in distinct server cache entries", async () => {
    const fetchMock = vi
      .fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockImplementation(async () => jsonResponse({ results: discoveryMovies(20), total_results: 20 }));
    const catalog = createCatalogService(
      createTmdbClient({ accessToken: "tmdb-test-token", fetchFn: fetchMock }),
      createMemoryCatalogCache(),
    );

    await catalog.discoverMovies({ genreId: 18, page: 1, sort: "popularity", year: null });
    await catalog.discoverMovies({ genreId: 28, page: 1, sort: "popularity", year: null });
    await catalog.discoverMovies({ genreId: 18, page: 2, sort: "popularity", year: null });

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("does not cache failed upstream calls and reuses successful genres and details", async () => {
    const fetchMock = vi
      .fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(jsonResponse({ genres: [{ id: 18, name: "Drama" }] }))
      .mockResolvedValueOnce(jsonResponse({ genres: [], id: 42, overview: "", poster_path: null, title: "Filme" }));
    const catalog = createCatalogService(
      createTmdbClient({
        accessToken: "tmdb-test-token",
        fetchFn: fetchMock,
        logger: testLogger(),
        sleepFn: vi.fn(async () => {}),
      }),
      createMemoryCatalogCache(),
    );

    const unavailableFetch = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>().mockResolvedValue(jsonResponse({}, 503));
    const unavailableClient = createTmdbClient({
      accessToken: "tmdb-test-token",
      fetchFn: unavailableFetch,
      logger: testLogger(),
      sleepFn: vi.fn(async () => {}),
    });
    const unavailableCatalog = createCatalogService(unavailableClient, createMemoryCatalogCache());

    await expect(unavailableCatalog.listGenres()).rejects.toBeInstanceOf(CatalogUnavailableError);
    await expect(unavailableCatalog.listGenres()).rejects.toBeInstanceOf(CatalogUnavailableError);
    expect(unavailableFetch).toHaveBeenCalledTimes(6);
    await expect(catalog.listGenres()).resolves.toEqual([{ id: 18, name: "Drama" }]);
    await expect(catalog.listGenres()).resolves.toEqual([{ id: 18, name: "Drama" }]);
    await catalog.getMovieDetails(42);
    await catalog.getMovieDetails(42);

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("does not let a failed discover prefetch affect the current page", async () => {
    const fetchMock = vi
      .fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(jsonResponse({ results: discoveryMovies(20), total_results: 45 }))
      .mockResolvedValueOnce(jsonResponse({}, 503));
    const catalog = createCatalogService(
      createTmdbClient({
        accessToken: "tmdb-test-token",
        fetchFn: fetchMock,
        logger: testLogger(),
        sleepFn: vi.fn(async () => {}),
      }),
      createMemoryCatalogCache(),
    );

    await expect(catalog.discoverMovies({ genreId: null, page: 1, sort: "popularity", year: null })).resolves.toMatchObject({ page: 1 });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("searches and normalizes movies with pt-BR and the approved poster fallback", async () => {
    const { catalog, fetchMock } = catalogWithResponse(
      jsonResponse({
        page: 2,
        results: [
          {
            id: 157336,
            overview: "Uma viagem interestelar.",
            poster_path: null,
            release_date: "2014-11-05",
            title: "Interestelar",
          },
        ],
        total_pages: 3,
      }),
    );

    await expect(catalog.searchMovies("Interestelar", 2)).resolves.toEqual({
      items: [
        {
          externalId: 157336,
          overview: "Uma viagem interestelar.",
          posterUrl: "/placeholders/poster-unavailable.png",
          releaseDate: "2014-11-05",
          title: "Interestelar",
        },
      ],
      page: 2,
      totalPages: 3,
    });

    const [input, init] = getFetchCall(fetchMock);
    const url = new URL(String(input));

    expect(url.pathname).toBe("/3/search/movie");
    expect(url.searchParams.get("include_adult")).toBe("false");
    expect(url.searchParams.get("language")).toBe("pt-BR");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("query")).toBe("Interestelar");
    expect(new Headers(init?.headers).get("authorization")).toBe(
      "Bearer tmdb-test-token",
    );
    expect(new URL(String(input)).pathname).toBe("/3/search/movie");
  });

  it("applies genre, year and sorting before paginating a title search", async () => {
    const fetchMock = vi
      .fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockImplementation(async (input) => {
        const page = Number(new URL(String(input)).searchParams.get("page"));

        return jsonResponse({
          page,
          results: Array.from({ length: 10 }, (_, index) => ({
            genre_ids: [page === 1 && index === 0 ? 18 : 28],
            id: page * 10 + index,
            overview: "",
            popularity: index,
            poster_path: null,
            release_date: "2024-01-01",
            title: `Filme ${page}-${index}`,
            vote_average: index,
            vote_count: 100,
          })),
          total_pages: 2,
        });
      });
    const catalog = createCatalogService(
      createTmdbClient({ accessToken: "tmdb-test-token", fetchFn: fetchMock }),
    );

    await expect(catalog.searchMovies("Batman", 1, {
      genreId: 18,
      sort: "rating",
      year: 2024,
    })).resolves.toMatchObject({
      items: [{ externalId: 10 }],
      page: 1,
      totalPages: 1,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new URL(String(fetchMock.mock.calls[0]?.[0])).searchParams.get("primary_release_year")).toBe("2024");
  });

  it("normalizes the weekly trending list and localized genres", async () => {
    const fetchMock = vi
      .fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(jsonResponse({ results: discoveryMovies(12) }))
      .mockResolvedValueOnce(
        jsonResponse({
          genres: [
            { id: 878, name: "Ficção científica" },
            { id: 18, name: "Drama" },
          ],
        }),
      );
    const catalog = createCatalogService(
      createTmdbClient({ accessToken: "tmdb-test-token", fetchFn: fetchMock }),
    );

    const trending = await catalog.getTrendingMovies();
    expect(trending).toHaveLength(10);
    expect(trending[0]).toMatchObject({
      externalId: 1,
      posterUrl: "/placeholders/poster-unavailable.png",
      rating: 7.5,
    });
    await expect(catalog.listGenres()).resolves.toEqual([
      { id: 18, name: "Drama" },
      { id: 878, name: "Ficção científica" },
    ]);

    expect(new URL(String(fetchMock.mock.calls[0]?.[0])).pathname).toBe(
      "/3/trending/movie/week",
    );
    expect(new URL(String(fetchMock.mock.calls[1]?.[0])).pathname).toBe(
      "/3/genre/movie/list",
    );
  });

  it("applies server-side discover filters, ordering and ten-movie UI pages", async () => {
    const fetchMock = vi
      .fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockImplementation(async () =>
        jsonResponse({ results: discoveryMovies(20), total_results: 45 }),
      );
    const catalog = createCatalogService(
      createTmdbClient({ accessToken: "tmdb-test-token", fetchFn: fetchMock }),
    );

    const discovered = await catalog.discoverMovies({
      genreId: 18,
      page: 2,
      sort: "rating",
      year: 2024,
    });
    expect(discovered.items).toHaveLength(10);
    expect(discovered.items[0]).toMatchObject({ externalId: 11 });
    expect(discovered.items.at(-1)).toMatchObject({ externalId: 20 });
    expect(discovered).toMatchObject({ page: 2, totalPages: 5 });

    const ratingUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(ratingUrl.pathname).toBe("/3/discover/movie");
    expect(ratingUrl.searchParams.get("page")).toBe("1");
    expect(ratingUrl.searchParams.get("with_genres")).toBe("18");
    expect(ratingUrl.searchParams.get("primary_release_year")).toBe("2024");
    expect(ratingUrl.searchParams.get("sort_by")).toBe("vote_average.desc");
    expect(ratingUrl.searchParams.get("vote_count.gte")).toBe("100");

    const sortExpectations = {
      popularity: "popularity.desc",
      releaseDate: "primary_release_date.desc",
      titleAsc: "title.asc",
      titleDesc: "title.desc",
    } as const;

    for (const [sort, expected] of Object.entries(sortExpectations)) {
      await catalog.discoverMovies({
        genreId: null,
        page: 3,
        sort: sort as keyof typeof sortExpectations,
        year: null,
      });
      const url = new URL(String(fetchMock.mock.calls.at(-1)?.[0]));
      expect(url.searchParams.get("page")).toBe("2");
      expect(url.searchParams.get("sort_by")).toBe(expected);
    }
  });

  it("normalizes movie details without exposing the external response", async () => {
    const { catalog, fetchMock } = catalogWithResponse(
      jsonResponse({
        backdrop_path: "/backdrop.jpg",
        genres: [{ name: "Ficção científica" }, { name: "Drama" }],
        id: 157336,
        overview: "Uma viagem interestelar.",
        poster_path: "/poster.jpg",
        release_date: "2014-11-05",
        runtime: 169,
        title: "Interestelar",
      }),
    );

    await expect(catalog.getMovieDetails(157336)).resolves.toEqual({
      backdropUrl: "https://image.tmdb.org/t/p/w500/backdrop.jpg",
      externalId: 157336,
      genres: ["Ficção científica", "Drama"],
      overview: "Uma viagem interestelar.",
      posterUrl: "https://image.tmdb.org/t/p/w500/poster.jpg",
      releaseDate: "2014-11-05",
      runtimeMinutes: 169,
      title: "Interestelar",
    });

    const [input] = getFetchCall(fetchMock);
    expect(new URL(String(input)).pathname).toBe("/3/movie/157336");
  });

  it("selects a deterministic supported trailer and treats no trailer as success", async () => {
    const withTrailer = catalogWithResponse(
      jsonResponse({
        results: [
          {
            iso_639_1: "en",
            key: "english-trailer",
            name: "Official Trailer",
            official: true,
            site: "YouTube",
            type: "Trailer",
          },
          {
            iso_639_1: "pt",
            key: "portuguese-trailer",
            name: "Trailer Oficial",
            official: true,
            site: "YouTube",
            type: "Trailer",
          },
          {
            key: "teaser",
            name: "Teaser",
            official: true,
            site: "YouTube",
            type: "Teaser",
          },
        ],
      }),
    );
    const withoutTrailer = catalogWithResponse(
      jsonResponse({
        results: [
          { key: "vimeo", name: "Trailer", site: "Vimeo", type: "Trailer" },
        ],
      }),
    );

    await expect(withTrailer.catalog.getMovieVideos(157336)).resolves.toEqual({
      trailer: {
        key: "portuguese-trailer",
        name: "Trailer Oficial",
        site: "YouTube",
      },
    });
    await expect(withoutTrailer.catalog.getMovieVideos(157336)).resolves.toEqual({
      trailer: null,
    });
  });

  it("maps timeout and upstream responses to the stable unavailable error", async () => {
    const timedOutClient = createTmdbClient({
      accessToken: "tmdb-test-token",
      fetchFn: (_input, init) =>
        new Promise((_resolve, reject) => {
          const signal = init?.signal;

          if (signal?.aborted) {
            reject(signal.reason);
            return;
          }

          signal?.addEventListener("abort", () => reject(signal.reason), {
            once: true,
          });
        }),
      timeoutMs: 1,
    });
    const unavailableCatalog = createCatalogService(timedOutClient);
    const unauthorizedCatalog = catalogWithResponse(
      jsonResponse({ status_message: "Invalid API key" }, 401),
    ).catalog;

    await expect(unavailableCatalog.searchMovies("Interestelar")).rejects.toBeInstanceOf(
      CatalogUnavailableError,
    );
    await expect(unauthorizedCatalog.searchMovies("Interestelar")).rejects.toMatchObject({
      code: "CATALOG_UNAVAILABLE",
      status: 503,
    });
  });

  it("retries a transient details failure once and succeeds without logging credentials", async () => {
    const logger = testLogger();
    const fetchMock = vi
      .fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(jsonResponse({ status_message: "Unavailable" }, 503))
      .mockResolvedValueOnce(
        jsonResponse({
          genres: [],
          id: 157336,
          overview: "Uma viagem interestelar.",
          poster_path: null,
          title: "Interestelar",
        }),
      );
    const catalog = createCatalogService(
      createTmdbClient({
        accessToken: "tmdb-test-token",
        fetchFn: fetchMock,
        logger,
        sleepFn: vi.fn(async () => {}),
      }),
    );

    await expect(catalog.getMovieDetails(157336)).resolves.toMatchObject({
      externalId: 157336,
      title: "Interestelar",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalledWith(
      "TMDb request failed operation=details path=/movie/157336 attempt=1/2 status=503 error.name=Response",
    );
    expect(logger.warn.mock.calls.flat().join(" ")).not.toContain("tmdb-test-token");
  });

  it.each([401, 404])("does not retry a non-transient %i details failure", async (status) => {
    const fetchMock = createFetchMock(jsonResponse({ status_message: "No" }, status));
    const catalog = createCatalogService(
      createTmdbClient({
        accessToken: "tmdb-test-token",
        fetchFn: fetchMock,
        logger: testLogger(),
        sleepFn: vi.fn(async () => {}),
      }),
    );

    await expect(catalog.getMovieDetails(157336)).rejects.toMatchObject({
      code: "CATALOG_UNAVAILABLE",
      status: 503,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns the stable error after a second transient details failure", async () => {
    const fetchMock = vi
      .fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValue(jsonResponse({ status_message: "Unavailable" }, 503));
    const catalog = createCatalogService(
      createTmdbClient({
        accessToken: "tmdb-test-token",
        fetchFn: fetchMock,
        logger: testLogger(),
        sleepFn: vi.fn(async () => {}),
      }),
    );

    await expect(catalog.getMovieDetails(157336)).rejects.toMatchObject({
      code: "CATALOG_UNAVAILABLE",
      status: 503,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries search twice before recovering from transient failures", async () => {
    const logger = testLogger();
    const fetchMock = vi
      .fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockRejectedValueOnce(new TypeError("network down"))
      .mockResolvedValueOnce(
        jsonResponse({
          page: 1,
          results: [
            {
              id: 42,
              overview: "Uma história.",
              poster_path: null,
              release_date: "2026-01-01",
              title: "Filme de teste",
            },
          ],
          total_pages: 1,
        }),
      );
    const catalog = createCatalogService(
      createTmdbClient({
        accessToken: "tmdb-test-token",
        fetchFn: fetchMock,
        logger,
        searchRetryDelaysMs: [300, 700],
        sleepFn: vi.fn(async () => {}),
      }),
    );

    await expect(catalog.searchMovies("filme")).resolves.toMatchObject({
      items: [{ externalId: 42 }],
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(logger.warn).toHaveBeenCalledWith(
      "TMDb request failed operation=search path=/search/movie attempt=1/3 status=503 error.name=Response",
    );
    expect(logger.warn).toHaveBeenCalledWith(
      "TMDb request failed operation=search path=/search/movie attempt=2/3 status=none error.name=TypeError",
    );
    expect(logger.info).toHaveBeenCalledWith(
      "TMDb request recovered operation=search attempt=3/3",
    );
  });

  it("returns the stable error only after all three search attempts fail", async () => {
    const fetchMock = vi
      .fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValue(jsonResponse({}, 503));
    const catalog = createCatalogService(
      createTmdbClient({
        accessToken: "tmdb-test-token",
        fetchFn: fetchMock,
        logger: testLogger(),
        sleepFn: vi.fn(async () => {}),
      }),
    );

    await expect(catalog.searchMovies("filme")).rejects.toMatchObject({
      code: "CATALOG_UNAVAILABLE",
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each([401, 404])("does not retry a non-transient %i search failure", async (status) => {
    const fetchMock = createFetchMock(jsonResponse({}, status));
    const catalog = createCatalogService(
      createTmdbClient({
        accessToken: "tmdb-test-token",
        fetchFn: fetchMock,
        logger: testLogger(),
        sleepFn: vi.fn(async () => {}),
      }),
    );

    await expect(catalog.searchMovies("filme")).rejects.toMatchObject({
      code: "CATALOG_UNAVAILABLE",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects catalog access for a non-organizer before calling the service", async () => {
    authMocks.requireRole.mockRejectedValueOnce(new authMocks.AuthorizationError());

    const response = await searchMoviesRoute(
      new Request("http://localhost:3000/api/catalog/movies?query=Interestelar"),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "FORBIDDEN",
        message: "Você não tem permissão para realizar esta ação.",
      },
    });
    expect(catalogRouteMocks.searchMovies).not.toHaveBeenCalled();
  });

  it("keeps the discovery endpoints organizer-only and returns application DTOs", async () => {
    authMocks.requireRole.mockResolvedValue({ id: "organizer" });
    catalogRouteMocks.getTrendingMovies.mockResolvedValue([{ externalId: 1 }]);
    catalogRouteMocks.listGenres.mockResolvedValue([{ id: 18, name: "Drama" }]);
    catalogRouteMocks.discoverMovies.mockResolvedValue({ items: [{ externalId: 2 }], page: 1, totalPages: 1 });

    await expect(trendingMoviesRoute(new Request("http://localhost:3000/api/catalog/trending"))).resolves.toMatchObject({ status: 200 });
    await expect(genresRoute(new Request("http://localhost:3000/api/catalog/genres"))).resolves.toMatchObject({ status: 200 });
    await expect(discoverMoviesRoute(new Request("http://localhost:3000/api/catalog/discover?page=1&sort=popularity"))).resolves.toMatchObject({ status: 200 });

    expect(authMocks.requireRole).toHaveBeenCalledWith(expect.any(Request), "ORGANIZER");
    expect(catalogRouteMocks.discoverMovies).toHaveBeenCalledWith({
      genreId: null,
      page: 1,
      sort: "popularity",
      year: null,
    });
  });
});

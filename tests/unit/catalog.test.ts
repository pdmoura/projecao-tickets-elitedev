import { describe, expect, it, vi } from "vitest";

import { GET as searchMoviesRoute } from "@/app/api/catalog/movies/route";
import { CatalogUnavailableError } from "@/modules/catalog/catalog.errors";
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
    getMovieDetails: vi.fn(),
    getMovieVideos: vi.fn(),
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

describe("TMDb catalog", () => {
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
});

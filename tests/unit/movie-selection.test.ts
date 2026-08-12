import { describe, expect, it, vi } from "vitest";

import { loadMovieSelection } from "@/modules/catalog/movie-selection";

const details = {
  backdropUrl: null,
  externalId: 42,
  genres: ["Drama"],
  overview: "Uma hist\u00f3ria.",
  posterUrl: "/placeholders/poster-unavailable.png",
  releaseDate: "2026-01-01",
  runtimeMinutes: 120,
  title: "Filme de teste",
};

describe("movie selection", () => {
  it("keeps the trailer when details and videos load", async () => {
    await expect(
      loadMovieSelection({
        getDetails: vi.fn().mockResolvedValue(details),
        getVideos: vi.fn().mockResolvedValue({
          trailer: { key: "trailer-key", name: "Trailer", site: "YouTube" },
        }),
      }),
    ).resolves.toEqual({
      details,
      trailer: { key: "trailer-key", name: "Trailer", site: "YouTube" },
    });
  });

  it("selects the movie when videos are unavailable", async () => {
    await expect(
      loadMovieSelection({
        getDetails: vi.fn().mockResolvedValue(details),
        getVideos: vi.fn().mockRejectedValue(new Error("CATALOG_UNAVAILABLE")),
      }),
    ).resolves.toEqual({ details, trailer: null });
  });

  it("keeps a details failure visible to the selection flow", async () => {
    await expect(
      loadMovieSelection({
        getDetails: vi.fn().mockRejectedValue(new Error("CATALOG_UNAVAILABLE")),
        getVideos: vi.fn().mockResolvedValue({ trailer: null }),
      }),
    ).rejects.toThrow("CATALOG_UNAVAILABLE");
  });

  it("retries only the selected movie details when the UI requests it again", async () => {
    const getDetails = vi
      .fn<() => Promise<typeof details>>()
      .mockRejectedValueOnce(new Error("CATALOG_UNAVAILABLE"))
      .mockResolvedValueOnce(details);
    const getVideos = vi.fn().mockResolvedValue({ trailer: null });

    await expect(loadMovieSelection({ getDetails, getVideos })).rejects.toThrow(
      "CATALOG_UNAVAILABLE",
    );
    await expect(loadMovieSelection({ getDetails, getVideos })).resolves.toEqual({
      details,
      trailer: null,
    });
    expect(getDetails).toHaveBeenCalledTimes(2);
  });
});

import { describe, expect, it } from "vitest";

import {
  createDiscoverCacheKey,
  getCompactPageNumbers,
  getOrganizerDiscoveryYears,
  resetDiscoverPage,
} from "@/modules/catalog/organizer-discovery";

describe("organizer catalog discovery state", () => {
  it("keys cached discover responses by every filter and page", () => {
    expect(createDiscoverCacheKey({ genreId: 18, page: 3, sort: "rating", year: 2025 })).toBe("3:18:2025:rating");
    expect(createDiscoverCacheKey({ genreId: null, page: 3, sort: "rating", year: 2025 })).not.toBe("3:18:2025:rating");
  });

  it("resets the page whenever a discovery filter changes", () => {
    expect(resetDiscoverPage({ genreId: 18, page: 4, sort: "popularity", year: 2025 }, { sort: "rating" })).toEqual({ genreId: 18, page: 1, sort: "rating", year: 2025 });
  });

  it("keeps pagination compact and exposes the relevant recent years", () => {
    expect(getCompactPageNumbers(7, 20)).toEqual([6, 7, 8, 9, 10]);
    expect(getOrganizerDiscoveryYears(2026)).toEqual([2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019]);
  });
});

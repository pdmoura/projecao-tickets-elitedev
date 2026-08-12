import { describe, expect, it } from "vitest";

import {
  canSearchCatalog,
  createSearchRequestTracker,
  normalizeCatalogQuery,
} from "@/modules/catalog/organizer-search";

describe("organizer movie search", () => {
  it("normalizes cache keys and only searches from two characters", () => {
    expect(normalizeCatalogQuery("  Parasita ")).toBe("parasita");
    expect(canSearchCatalog("")).toBe(false);
    expect(canSearchCatalog("a")).toBe(false);
    expect(canSearchCatalog("up")).toBe(true);
  });

  it("allows only the latest request to update results", () => {
    const tracker = createSearchRequestTracker();
    const olderRequest = tracker.begin();
    const newestRequest = tracker.begin();

    expect(tracker.isCurrent(olderRequest)).toBe(false);
    expect(tracker.isCurrent(newestRequest)).toBe(true);
  });
});

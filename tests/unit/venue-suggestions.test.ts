import { describe, expect, it } from "vitest";

import { getVenueSuggestions } from "@/modules/events/venue-suggestions";

describe("venue suggestions", () => {
  it("removes blanks and duplicates with a stable pt-BR order", () => {
    expect(
      getVenueSuggestions(["Cine Projeção", null, "Cine Brasília", " Cine Projeção ", ""]),
    ).toEqual(["Cine Brasília", "Cine Projeção"]);
  });
});

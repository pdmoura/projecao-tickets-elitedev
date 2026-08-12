import { describe, expect, it } from "vitest";

import {
  formatSeatLabels,
  formatSeatsRemovedMessage,
  formatSeatsUnavailableMessage,
  resolveUnavailableSeatLabels,
} from "@/modules/seats/seat-messages";

describe("seat availability messages", () => {
  it("formats every seat label with the correct Portuguese conjunction", () => {
    expect(formatSeatLabels(["B7"])).toBe("B7");
    expect(formatSeatLabels(["B7", "B8"])).toBe("B7 e B8");
    expect(formatSeatLabels(["B7", "B8", "C4"])).toBe("B7, B8 e C4");
  });

  it("uses singular and plural messages without duplicating labels", () => {
    expect(formatSeatsRemovedMessage(["B7"])).toBe(
      "O assento B7 acabou de ficar indispon\u00edvel e foi removido da sua sele\u00e7\u00e3o.",
    );
    expect(formatSeatsRemovedMessage(["B7", "B8"])).toBe(
      "Os assentos B7 e B8 acabaram de ficar indispon\u00edveis e foram removidos da sua sele\u00e7\u00e3o.",
    );
    expect(formatSeatsUnavailableMessage(["B7", "B8"])).toBe(
      "Os assentos B7 e B8 n\u00e3o est\u00e3o mais dispon\u00edveis. Escolha outros lugares para continuar.",
    );
  });

  it("falls back to already-loaded seat labels only when the API has none", () => {
    expect(
      resolveUnavailableSeatLabels({
        seatIds: ["seat-b7", "seat-b8"],
        seatLabels: [],
        seats: [
          { id: "seat-b7", label: "B7" },
          { id: "seat-b8", label: "B8" },
        ],
      }),
    ).toEqual(["B7", "B8"]);
  });
});

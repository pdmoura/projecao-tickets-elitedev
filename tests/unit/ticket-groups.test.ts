import { describe, expect, it } from "vitest";

import { groupTicketsByEvent } from "@/components/ticket-groups";
import type { TicketSummary } from "@/modules/tickets";

function ticket(id: string, eventId: string, startsAt: string): TicketSummary {
  return {
    createdAt: "2026-08-12T12:00:00.000Z",
    event: {
      id: eventId,
      movieTitle: "Mesmo filme",
      posterPath: "/poster.png",
      roomName: "Sala 1",
      startsAt,
      venueName: "Cine Projeção",
    },
    id,
    seatLabel: "A1",
    status: "AVAILABLE_FOR_ENTRY",
  };
}

describe("ticket event groups", () => {
  it("groups multiple seats from the same event", () => {
    const groups = groupTicketsByEvent([
      ticket("ticket-1", "event-1", "2026-08-12T18:00:00.000Z"),
      ticket("ticket-2", "event-1", "2026-08-12T18:00:00.000Z"),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.tickets.map((item) => item.id)).toEqual(["ticket-1", "ticket-2"]);
  });

  it("keeps separate events apart even when a movie title is the same", () => {
    const groups = groupTicketsByEvent([
      ticket("ticket-1", "event-1", "2026-08-12T18:00:00.000Z"),
      ticket("ticket-2", "event-2", "2026-08-13T21:00:00.000Z"),
    ]);

    expect(groups.map((group) => group.event.id)).toEqual(["event-1", "event-2"]);
  });
});

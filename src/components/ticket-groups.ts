import type { TicketSummary } from "@/modules/tickets";

export type TicketEventGroup = {
  event: TicketSummary["event"];
  tickets: TicketSummary[];
};

export function groupTicketsByEvent(
  tickets: TicketSummary[],
): TicketEventGroup[] {
  const groups = new Map<string, TicketEventGroup>();

  for (const ticket of tickets) {
    const existingGroup = groups.get(ticket.event.id);

    if (existingGroup) {
      existingGroup.tickets.push(ticket);
    } else {
      groups.set(ticket.event.id, { event: ticket.event, tickets: [ticket] });
    }
  }

  return [...groups.values()];
}

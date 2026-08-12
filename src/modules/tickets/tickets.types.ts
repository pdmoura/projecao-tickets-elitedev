export type TicketSummary = {
  createdAt: string;
  event: {
    id: string;
    movieTitle: string;
    posterPath: string;
    roomName: string;
    startsAt: string;
    venueName: string;
  };
  id: string;
  seatLabel: string;
  status: "AVAILABLE_FOR_ENTRY" | "USED";
};

export type TicketDetail = TicketSummary & {
  holderName: string;
  manualCode: string;
  qrDataUrl: string;
  unitPriceCents: number;
  usedAt: string | null;
};

export type SharedTicketDetail = Omit<TicketDetail, "holderName">;

export type OrganizerEvent = {
  capacity: number | null;
  createdAt: string;
  id: string;
  movie: {
    overview: string | null;
    posterPath: string;
    releaseDate: string | null;
    title: string;
  };
  priceCents: number | null;
  publishedAt: string | null;
  roomName: string | null;
  rows: number | null;
  seatsPerRow: number | null;
  startsAt: string | null;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: string;
  venueName: string | null;
};

export type OrganizerEventDraftInput = {
  movieExternalId: number;
};

export type OrganizerEventUpdateInput = {
  priceCents: number;
  roomName: string;
  rows: number;
  seatsPerRow: number;
  startsAt: Date;
  venueName: string;
};

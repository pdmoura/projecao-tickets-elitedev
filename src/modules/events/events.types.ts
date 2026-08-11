export type PublishedEventSummary = {
  id: string;
  movie: {
    posterPath: string;
    title: string;
  };
  priceCents: number;
  roomName: string;
  startsAt: string;
  venueName: string;
};

export type PublishedEventDetail = PublishedEventSummary & {
  capacity: number;
  movie: PublishedEventSummary["movie"] & {
    overview: string | null;
    releaseDate: string | null;
  };
};

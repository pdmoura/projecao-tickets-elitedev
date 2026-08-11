export type CatalogMovie = {
  externalId: number;
  overview: string;
  posterUrl: string;
  releaseDate: string | null;
  title: string;
};

export type CatalogSearchResult = {
  items: CatalogMovie[];
  page: number;
  totalPages: number;
};

export type CatalogMovieDetails = CatalogMovie & {
  backdropUrl: string | null;
  genres: string[];
  runtimeMinutes: number | null;
};

export type CatalogTrailer = {
  key: string;
  name: string;
  site: "YouTube";
};

export type CatalogMovieVideos = {
  trailer: CatalogTrailer | null;
};

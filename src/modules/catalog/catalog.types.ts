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

export type CatalogSearchFilters = {
  genreId: number | null;
  sort: CatalogDiscoverSort;
  year: number | null;
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

export type CatalogDiscoveryMovie = CatalogMovie & {
  rating: number | null;
};

export type CatalogGenre = {
  id: number;
  name: string;
};

export const catalogDiscoverSorts = [
  "popularity",
  "rating",
  "releaseDate",
  "titleAsc",
  "titleDesc",
] as const;

export type CatalogDiscoverSort = (typeof catalogDiscoverSorts)[number];

export type CatalogDiscoverInput = {
  genreId: number | null;
  page: number;
  sort: CatalogDiscoverSort;
  year: number | null;
};

export type CatalogDiscoverResult = {
  items: CatalogDiscoveryMovie[];
  page: number;
  totalPages: number;
};

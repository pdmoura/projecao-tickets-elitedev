import "server-only";

export {
  getMovieDetails,
  getMovieVideos,
  getTrendingMovies,
  listGenres,
  discoverMovies,
  searchMovies,
} from "./catalog.service";
export {
  CatalogUnavailableError,
  CatalogValidationError,
} from "./catalog.errors";
export type {
  CatalogMovie,
  CatalogDiscoverInput,
  CatalogDiscoverResult,
  CatalogDiscoveryMovie,
  CatalogDiscoverSort,
  CatalogGenre,
  CatalogMovieDetails,
  CatalogMovieVideos,
  CatalogSearchResult,
  CatalogTrailer,
} from "./catalog.types";

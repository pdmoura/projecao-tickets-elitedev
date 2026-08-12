import type {
  CatalogMovieDetails,
  CatalogMovieVideos,
} from "./catalog.types";

export type MovieSelection = {
  details: CatalogMovieDetails;
  trailer: CatalogMovieVideos["trailer"];
};

type MovieSelectionLoaders = {
  getDetails: () => Promise<CatalogMovieDetails>;
  getVideos: () => Promise<CatalogMovieVideos>;
};

export async function loadMovieSelection({
  getDetails,
  getVideos,
}: MovieSelectionLoaders): Promise<MovieSelection> {
  const [details, videos] = await Promise.all([
    getDetails(),
    getVideos().catch(() => ({ trailer: null })),
  ]);

  return { details, trailer: videos.trailer };
}

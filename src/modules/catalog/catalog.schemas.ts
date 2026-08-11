import { CatalogValidationError } from "./catalog.errors";

const maximumTmdbPage = 500;

export function parseSearchMoviesInput(searchParams: URLSearchParams): {
  page: number;
  query: string;
} {
  const query = searchParams.get("query")?.trim();

  if (!query) {
    throw new CatalogValidationError("Informe um título para buscar filmes.");
  }

  const pageValue = searchParams.get("page") ?? "1";
  const page = Number(pageValue);

  if (!Number.isInteger(page) || page < 1 || page > maximumTmdbPage) {
    throw new CatalogValidationError(
      `A página deve ser um número inteiro entre 1 e ${maximumTmdbPage}.`,
    );
  }

  return { page, query };
}

export function parseMovieId(movieId: string): number {
  const parsedMovieId = Number(movieId);

  if (
    !Number.isSafeInteger(parsedMovieId) ||
    parsedMovieId < 1 ||
    !/^\d+$/.test(movieId)
  ) {
    throw new CatalogValidationError("Identificador de filme inválido.");
  }

  return parsedMovieId;
}

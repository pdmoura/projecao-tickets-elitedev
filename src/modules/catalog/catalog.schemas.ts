import { CatalogValidationError } from "./catalog.errors";
import { catalogDiscoverSorts, type CatalogDiscoverInput } from "./catalog.types";

const maximumTmdbPage = 500;

export function parseSearchMoviesInput(searchParams: URLSearchParams): {
  genreId: number | null;
  page: number;
  query: string;
  sort: CatalogDiscoverInput["sort"];
  year: number | null;
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

  const sortValue = searchParams.get("sort") ?? "popularity";

  if (!(catalogDiscoverSorts as readonly string[]).includes(sortValue)) {
    throw new CatalogValidationError("Ordenação inválida.");
  }

  const year = parseOptionalPositiveInteger(searchParams.get("year"), "Ano");

  if (year && (year < 1888 || year > new Date().getUTCFullYear())) {
    throw new CatalogValidationError("Ano inválido.");
  }

  return {
    genreId: parseOptionalPositiveInteger(searchParams.get("genreId"), "Gênero"),
    page,
    query,
    sort: sortValue as CatalogDiscoverInput["sort"],
    year,
  };
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

function parseOptionalPositiveInteger(value: string | null, field: string): number | null {
  if (value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new CatalogValidationError(`${field} inválido.`);
  }

  return parsed;
}

export function parseDiscoverMoviesInput(searchParams: URLSearchParams): CatalogDiscoverInput {
  const page = parseOptionalPositiveInteger(searchParams.get("page") ?? "1", "Página") ?? 1;

  if (page > maximumTmdbPage * 2) {
    throw new CatalogValidationError(`A página deve ser um número inteiro entre 1 e ${maximumTmdbPage * 2}.`);
  }

  const sortValue = searchParams.get("sort") ?? "popularity";

  if (!(catalogDiscoverSorts as readonly string[]).includes(sortValue)) {
    throw new CatalogValidationError("Ordenação inválida.");
  }

  const year = parseOptionalPositiveInteger(searchParams.get("year"), "Ano");

  if (year && (year < 1888 || year > new Date().getUTCFullYear())) {
    throw new CatalogValidationError("Ano inválido.");
  }

  return {
    genreId: parseOptionalPositiveInteger(searchParams.get("genreId"), "Gênero"),
    page,
    sort: sortValue as CatalogDiscoverInput["sort"],
    year,
  };
}

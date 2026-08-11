export class CatalogUnavailableError extends Error {
  readonly code = "CATALOG_UNAVAILABLE";
  readonly status = 503;

  constructor() {
    super("O catálogo de filmes está indisponível no momento.");
    this.name = "CatalogUnavailableError";
  }
}

export class CatalogValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "CatalogValidationError";
  }
}

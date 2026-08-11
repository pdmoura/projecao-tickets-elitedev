export class AuthenticationError extends Error {
  readonly code = "AUTH_REQUIRED";
  readonly status = 401;

  constructor() {
    super("Autenticação obrigatória.");
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  readonly code = "FORBIDDEN";
  readonly status = 403;

  constructor() {
    super("Você não tem permissão para realizar esta ação.");
    this.name = "AuthorizationError";
  }
}

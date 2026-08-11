import "server-only";

import { AuthorizationError, AuthenticationError } from "./auth.errors";
import { auth } from "./better-auth";
import { isUserRole, type AuthSession, type UserRole } from "./auth.types";

function normalizeSession(rawSession: {
  session: { id: string; expiresAt: Date };
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null | undefined;
    role?: unknown;
  };
}): AuthSession {
  if (!isUserRole(rawSession.user.role)) {
    throw new Error("Authenticated user has an invalid application role.");
  }

  return {
    session: {
      expiresAt: rawSession.session.expiresAt,
      id: rawSession.session.id,
    },
    user: {
      email: rawSession.user.email,
      id: rawSession.user.id,
      image: rawSession.user.image ?? null,
      name: rawSession.user.name,
      role: rawSession.user.role,
    },
  };
}

export async function getSession(request: Request): Promise<AuthSession | null> {
  const rawSession = await auth.api.getSession({ headers: request.headers });

  return rawSession ? normalizeSession(rawSession) : null;
}

export async function requireUser(request: Request): Promise<AuthSession> {
  const session = await getSession(request);

  if (!session) {
    throw new AuthenticationError();
  }

  return session;
}

export async function requireRole(
  request: Request,
  role: UserRole,
): Promise<AuthSession> {
  const session = await requireUser(request);

  if (session.user.role !== role) {
    throw new AuthorizationError();
  }

  return session;
}

export async function requireOwner(
  request: Request,
  resourceOwnerId: string,
): Promise<AuthSession> {
  const session = await requireUser(request);

  if (session.user.id !== resourceOwnerId) {
    throw new AuthorizationError();
  }

  return session;
}

export { AuthorizationError, AuthenticationError } from "./auth.errors";
export { getRoleHomePath } from "./role-redirect";
export type {
  AuthenticatedSession,
  AuthenticatedUser,
  AuthSession,
  UserRole,
} from "./auth.types";

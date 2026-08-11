export const userRoles = ["ORGANIZER", "CUSTOMER", "GATE"] as const;

export type UserRole = (typeof userRoles)[number];

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
};

export type AuthenticatedSession = {
  id: string;
  expiresAt: Date;
};

export type AuthSession = {
  session: AuthenticatedSession;
  user: AuthenticatedUser;
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && userRoles.includes(value as UserRole);
}

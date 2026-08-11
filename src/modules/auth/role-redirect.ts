import type { UserRole } from "./auth.types";

export function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case "ORGANIZER":
      return "/organizer";
    case "GATE":
      return "/gate";
    case "CUSTOMER":
      return "/";
  }
}

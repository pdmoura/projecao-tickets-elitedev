import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { TicketCredentialError } from "./ticket-credentials";

const shareTokenBytes = 32;

export function normalizeShareToken(value: string): string {
  const normalized = value.trim();
  const decoded = Buffer.from(normalized, "base64url");

  if (
    decoded.length !== shareTokenBytes ||
    decoded.toString("base64url") !== normalized
  ) {
    throw new TicketCredentialError("Token de compartilhamento inválido.");
  }

  return normalized;
}

export function generateShareToken(): string {
  return randomBytes(shareTokenBytes).toString("base64url");
}

export function hashShareToken(token: string): string {
  return createHash("sha256")
    .update(normalizeShareToken(token), "utf8")
    .digest("hex");
}

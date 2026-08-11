import { CheckInValidationError } from "./check-in.errors";
import type { ManualCheckInInput, QrCheckInInput } from "./check-in.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requireString(value: unknown, message: string): string {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    throw new CheckInValidationError(message);
  }

  return normalized;
}

function requireInput(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new CheckInValidationError("Dados de check-in inválidos.");
  }

  return value;
}

export function parseManualCheckInInput(value: unknown): ManualCheckInInput {
  const input = requireInput(value);

  return {
    code: requireString(input.code, "Informe o código manual."),
    eventId: requireString(input.eventId, "Selecione uma sessão."),
  };
}

export function parseQrCheckInInput(value: unknown): QrCheckInInput {
  const input = requireInput(value);

  return {
    eventId: requireString(input.eventId, "Selecione uma sessão."),
    token: requireString(input.token, "Informe a credencial do QR."),
  };
}

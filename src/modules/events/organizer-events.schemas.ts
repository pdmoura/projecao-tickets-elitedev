import {
  OrganizerEventValidationError,
} from "./organizer-events.errors";
import type {
  OrganizerEventDraftInput,
  OrganizerEventUpdateInput,
} from "./organizer-events.types";

const maximumRows = 20;
const maximumSeatsPerRow = 30;
const maximumCapacity = 600;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requireTrimmedString(value: unknown, message: string): string {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    throw new OrganizerEventValidationError(message);
  }

  return normalized;
}

function requirePositiveInteger(value: unknown, message: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    throw new OrganizerEventValidationError(message);
  }

  return value;
}

function parseDate(value: unknown): Date {
  const rawValue = requireTrimmedString(value, "Informe a data e o horário da sessão.");
  const parsed = new Date(rawValue);

  if (Number.isNaN(parsed.getTime())) {
    throw new OrganizerEventValidationError("Informe uma data e horário válidos.");
  }

  return parsed;
}

export function parseOrganizerEventDraftInput(
  value: unknown,
): OrganizerEventDraftInput {
  if (!isRecord(value)) {
    throw new OrganizerEventValidationError("Dados da sessão inválidos.");
  }

  return {
    movieExternalId: requirePositiveInteger(
      value.movieExternalId,
      "Selecione um filme válido.",
    ),
  };
}

export function parseOrganizerEventUpdateInput(
  value: unknown,
): OrganizerEventUpdateInput {
  if (!isRecord(value)) {
    throw new OrganizerEventValidationError("Dados da sessão inválidos.");
  }

  const rows = requirePositiveInteger(value.rows, "Informe o número de fileiras.");
  const seatsPerRow = requirePositiveInteger(
    value.seatsPerRow,
    "Informe a quantidade de assentos por fileira.",
  );

  if (rows > maximumRows || seatsPerRow > maximumSeatsPerRow) {
    throw new OrganizerEventValidationError(
      "A sala suporta até 20 fileiras e 30 assentos por fileira.",
    );
  }

  if (rows * seatsPerRow > maximumCapacity) {
    throw new OrganizerEventValidationError(
      "A capacidade máxima da sessão é de 600 lugares.",
    );
  }

  return {
    priceCents: requirePositiveInteger(value.priceCents, "Informe um preço válido."),
    roomName: requireTrimmedString(value.roomName, "Informe a sala."),
    rows,
    seatsPerRow,
    startsAt: parseDate(value.startsAt),
    venueName: requireTrimmedString(value.venueName, "Informe o local da sessão."),
  };
}

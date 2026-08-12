export type GateAdmissionState = "ACTIVE" | "EXPIRED" | "NOT_STARTED";

const saoPauloTimeZone = "America/Sao_Paulo";

function getSaoPauloDateParts(date: Date): { day: number; month: number; year: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: saoPauloTimeZone,
    year: "numeric",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return { day: read("day"), month: read("month"), year: read("year") };
}

export function isCustomerSaleOpen(startsAt: Date, now = new Date()): boolean {
  return startsAt.getTime() > now.getTime();
}

export function getGateAdmissionState(
  startsAt: Date,
  now = new Date(),
): GateAdmissionState {
  if (isCustomerSaleOpen(startsAt, now)) {
    return "NOT_STARTED";
  }

  const { day, month, year } = getSaoPauloDateParts(startsAt);
  // O schema não persiste duração: a operação de portaria permanece ativa
  // até 00:00 do dia seguinte no fuso America/Sao_Paulo.
  const endOfLocalDay = new Date(Date.UTC(year, month - 1, day + 1, 3));

  return now.getTime() < endOfLocalDay.getTime() ? "ACTIVE" : "EXPIRED";
}

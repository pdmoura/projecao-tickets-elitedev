type SeatReference = {
  id: string;
  label: string;
};

function normalizedLabels(labels: readonly string[]): string[] {
  return [...new Set(labels.map((label) => label.trim()).filter(Boolean))];
}

export function formatSeatLabels(labels: readonly string[]): string {
  const formattedLabels = normalizedLabels(labels);

  if (formattedLabels.length <= 1) {
    return formattedLabels[0] ?? "";
  }

  if (formattedLabels.length === 2) {
    return formattedLabels.join(" e ");
  }

  return `${formattedLabels.slice(0, -1).join(", ")} e ${formattedLabels.at(-1)}`;
}

export function formatSeatsRemovedMessage(labels: readonly string[]): string {
  const normalized = normalizedLabels(labels);
  const formattedLabels = formatSeatLabels(normalized);

  return normalized.length === 1
    ? `O assento ${formattedLabels} acabou de ficar indisponível e foi removido da sua seleção.`
    : `Os assentos ${formattedLabels} acabaram de ficar indisponíveis e foram removidos da sua seleção.`;
}

export function formatSeatsUnavailableMessage(labels: readonly string[]): string {
  const normalized = normalizedLabels(labels);
  const formattedLabels = formatSeatLabels(normalized);

  return normalized.length === 1
    ? `O assento ${formattedLabels} não está mais disponível. Escolha outro lugar para continuar.`
    : `Os assentos ${formattedLabels} não estão mais disponíveis. Escolha outros lugares para continuar.`;
}

export function resolveUnavailableSeatLabels({
  seatIds,
  seatLabels,
  seats,
}: {
  seatIds: readonly string[];
  seatLabels: readonly string[];
  seats: readonly SeatReference[];
}): string[] {
  const labels = normalizedLabels(seatLabels);

  if (labels.length > 0) {
    return labels;
  }

  const labelsById = new Map(seats.map((seat) => [seat.id, seat.label]));

  return normalizedLabels(seatIds.map((seatId) => labelsById.get(seatId) ?? seatId));
}

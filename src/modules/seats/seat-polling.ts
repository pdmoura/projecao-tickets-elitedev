export type SeatPollingController = {
  refresh: () => Promise<void>;
  start: () => void;
  stop: () => void;
};

export function createSeatPollingController<T>({
  fetchAvailability,
  intervalMs,
  onSnapshot,
}: {
  fetchAvailability: (signal: AbortSignal) => Promise<T | null>;
  intervalMs: number;
  onSnapshot: (snapshot: T) => void;
}): SeatPollingController {
  let active = false;
  let inFlight = false;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let abortController: AbortController | null = null;

  async function refresh(): Promise<void> {
    if (!active || inFlight) {
      return;
    }

    inFlight = true;
    const requestController = new AbortController();
    abortController = requestController;

    try {
      const snapshot = await fetchAvailability(requestController.signal);

      if (active && snapshot !== null) {
        onSnapshot(snapshot);
      }
    } catch {
      // Polling is an enhancement; the current snapshot remains usable.
    } finally {
      inFlight = false;
      if (abortController === requestController) {
        abortController = null;
      }
    }
  }

  return {
    refresh,
    start() {
      if (active) {
        return;
      }

      active = true;
      void refresh();
      intervalId = setInterval(() => {
        void refresh();
      }, intervalMs);
    },
    stop() {
      active = false;
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      abortController?.abort();
      abortController = null;
    },
  };
}

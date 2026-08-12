import { describe, expect, it, vi } from "vitest";

import { createSeatPollingController } from "@/modules/seats/seat-polling";

describe("seat polling", () => {
  it("does not overlap requests and cancels the active request on cleanup", async () => {
    let resolveRequest: ((value: string[] | null) => void) | undefined;
    let requestSignal: AbortSignal | undefined;
    const onSnapshot = vi.fn();
    const fetchAvailability = vi.fn(
      (signal: AbortSignal) =>
        new Promise<string[] | null>((resolve) => {
          requestSignal = signal;
          resolveRequest = resolve;
        }),
    );
    const controller = createSeatPollingController({
      fetchAvailability,
      intervalMs: 60_000,
      onSnapshot,
    });

    controller.start();
    await controller.refresh();

    expect(fetchAvailability).toHaveBeenCalledTimes(1);
    expect(requestSignal?.aborted).toBe(false);

    controller.stop();
    resolveRequest?.(["seat-a1"]);
    await Promise.resolve();

    expect(requestSignal?.aborted).toBe(true);
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it("applies the current snapshot when polling is active", async () => {
    const onSnapshot = vi.fn();
    const controller = createSeatPollingController({
      fetchAvailability: vi.fn(async () => ["seat-a1"]),
      intervalMs: 60_000,
      onSnapshot,
    });

    controller.start();
    await Promise.resolve();
    await Promise.resolve();
    controller.stop();

    expect(onSnapshot).toHaveBeenCalledWith(["seat-a1"]);
  });
});

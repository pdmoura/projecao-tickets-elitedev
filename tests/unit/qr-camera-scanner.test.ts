import { describe, expect, it, vi } from "vitest";

vi.mock("jsqr", () => ({ default: vi.fn() }));

import jsQR from "jsqr";

import {
  createFallbackQrDecoder,
  createNativeQrDecoder,
  createSingleTokenHandler,
  stopMediaStream,
} from "@/components/qr-camera-decoder";
import { getCameraErrorMessage } from "@/components/qr-camera-scanner";

describe("QR camera scanner", () => {
  it("uses the native detector when it explicitly supports QR", async () => {
    const previous = (globalThis as { BarcodeDetector?: unknown }).BarcodeDetector;
    const detect = vi.fn().mockResolvedValue([{ rawValue: "native-token" }]);

    class FakeBarcodeDetector {
      static async getSupportedFormats() {
        return ["qr_code"];
      }

      constructor(options: { formats: string[] }) {
        void options;
      }

      detect = detect;
    }

    (globalThis as { BarcodeDetector?: unknown }).BarcodeDetector = FakeBarcodeDetector;
    try {
      const decoder = await createNativeQrDecoder();

      expect(decoder?.kind).toBe("native");
      await expect(decoder?.decode({} as HTMLVideoElement)).resolves.toBe("native-token");
    } finally {
      (globalThis as { BarcodeDetector?: unknown }).BarcodeDetector = previous;
    }
  });

  it("falls back to jsQR when a native detector is unavailable", async () => {
    vi.mocked(jsQR).mockReturnValue({ data: "fallback-token" } as ReturnType<typeof jsQR>);
    const context = {
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue({
        data: new Uint8ClampedArray(4),
        height: 1,
        width: 1,
      }),
    };
    const canvas = {
      getContext: vi.fn().mockReturnValue(context),
      height: 0,
      width: 0,
    } as unknown as HTMLCanvasElement;
    const decoder = createFallbackQrDecoder(canvas);

    await expect(
      decoder.decode({ videoHeight: 1, videoWidth: 1 } as HTMLVideoElement),
    ).resolves.toBe("fallback-token");
    expect(jsQR).toHaveBeenCalledTimes(1);
  });

  it("delivers a detected token once and stops the stream after use", async () => {
    const onToken = vi.fn().mockResolvedValue(undefined);
    const handleToken = createSingleTokenHandler(onToken);
    const stop = vi.fn();

    await Promise.all([handleToken("one-token"), handleToken("one-token")]);
    stopMediaStream({ getTracks: () => [{ stop }] } as unknown as MediaStream);

    expect(onToken).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it("explains permission denial and a missing camera with specific messages", () => {
    expect(getCameraErrorMessage(new DOMException("", "NotAllowedError"))).toBe(
      "O acesso à câmera foi negado. Libere a permissão do navegador ou use o código manual.",
    );
    expect(getCameraErrorMessage(new DOMException("", "NotFoundError"))).toBe(
      "Nenhuma câmera foi encontrada neste dispositivo. Use o código manual.",
    );
  });
});

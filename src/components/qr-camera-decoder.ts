import jsQR from "jsqr";

export type BarcodeDetectorInstance = {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue?: string }>>;
};

export type BarcodeDetectorConstructor = {
  new (options: { formats: string[] }): BarcodeDetectorInstance;
  getSupportedFormats?: () => Promise<string[]>;
};

export type QrFrameDecoder = {
  kind: "fallback" | "native";
  decode(video: HTMLVideoElement): Promise<string | null>;
};

export function getBarcodeDetector(): BarcodeDetectorConstructor | null {
  const browser = globalThis as typeof globalThis & {
    BarcodeDetector?: BarcodeDetectorConstructor;
  };

  return browser.BarcodeDetector ?? null;
}

export async function createNativeQrDecoder(): Promise<QrFrameDecoder | null> {
  const Detector = getBarcodeDetector();

  if (!Detector) {
    return null;
  }

  try {
    const formats = await Detector.getSupportedFormats?.();

    if (formats && !formats.includes("qr_code")) {
      return null;
    }

    const detector = new Detector({ formats: ["qr_code"] });

    return {
      kind: "native",
      async decode(video) {
        const codes = await detector.detect(video);

        return codes.find((code) => code.rawValue?.trim())?.rawValue?.trim() ?? null;
      },
    };
  } catch {
    return null;
  }
}

export function createFallbackQrDecoder(
  canvas: HTMLCanvasElement,
): QrFrameDecoder {
  return {
    kind: "fallback",
    async decode(video) {
      const width = video.videoWidth;
      const height = video.videoHeight;

      if (!width || !height) {
        return null;
      }

      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });

      if (!context) {
        return null;
      }

      context.drawImage(video, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      const result = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      return result?.data.trim() || null;
    },
  };
}

export function createSingleTokenHandler(
  onToken: (token: string) => Promise<void>,
): (token: string) => Promise<boolean> {
  let handled = false;

  return async (token) => {
    if (handled || !token) {
      return false;
    }

    handled = true;
    await onToken(token);
    return true;
  };
}

export function stopMediaStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

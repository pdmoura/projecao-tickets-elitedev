"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type BarcodeDetectorInstance = {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => BarcodeDetectorInstance;

type CameraState =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "scanning" }
  | { kind: "unsupported" }
  | { kind: "error"; message: string };

function getBarcodeDetector(): BarcodeDetectorConstructor | null {
  const browser = globalThis as typeof globalThis & {
    BarcodeDetector?: BarcodeDetectorConstructor;
  };

  return browser.BarcodeDetector ?? null;
}

export function getCameraErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "O acesso à câmera foi negado. Use o código manual abaixo.";
    }

    if (error.name === "NotFoundError") {
      return "Nenhuma câmera foi encontrada neste dispositivo. Use o código manual abaixo.";
    }
  }

  return "Não foi possível iniciar a câmera. Use o código manual abaixo.";
}

export function QrCameraScanner({
  disabled = false,
  onToken,
}: {
  disabled?: boolean;
  onToken: (token: string) => Promise<void>;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scanningRef = useRef(false);
  const [state, setState] = useState<CameraState>({ kind: "idle" });

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  async function startCamera() {
    if (disabled || state.kind === "starting" || state.kind === "scanning") {
      return;
    }

    const Detector = getBarcodeDetector();
    if (!navigator.mediaDevices?.getUserMedia || !Detector) {
      setState({ kind: "unsupported" });
      return;
    }

    setState({ kind: "starting" });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } },
      });
      const video = videoRef.current;

      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();
      const detector = new Detector({ formats: ["qr_code"] });
      scanningRef.current = true;
      setState({ kind: "scanning" });

      const detectNextFrame = async () => {
        if (!scanningRef.current || !videoRef.current) {
          return;
        }

        try {
          const codes = await detector.detect(videoRef.current);
          const token = codes.find((code) => code.rawValue?.trim())?.rawValue?.trim();

          if (token) {
            stopCamera();
            await onToken(token);
            return;
          }
        } catch {
          // A frame sem leitura é normal; a câmera continua ativa.
        }

        if (scanningRef.current) {
          animationFrameRef.current = window.requestAnimationFrame(detectNextFrame);
        }
      };

      void detectNextFrame();
    } catch (error) {
      stopCamera();
      setState({ kind: "error", message: getCameraErrorMessage(error) });
    }
  }

  return (
    <section className="border border-gate-border bg-gate-surface p-5 sm:p-6" aria-labelledby="scanner-title">
      <p className="font-code text-xs uppercase tracking-[0.16em] text-gate-valid">Leitura por câmera</p>
      <h1 className="mt-3 font-display text-4xl leading-none sm:text-5xl" id="scanner-title">Escanear ingresso</h1>
      <p className="mt-4 text-sm leading-6 text-gate-muted">Posicione o QR do ingresso na área de leitura. A validação usa a mesma credencial opaca do QR.</p>
      <div className="relative mt-6 aspect-[4/3] overflow-hidden border border-gate-border bg-gate-bg">
        <video autoPlay className="size-full object-cover" muted playsInline ref={videoRef} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-5 border-2 border-gate-valid/80" />
        {state.kind !== "scanning" ? <p className="absolute inset-x-5 bottom-5 text-center text-sm text-gate-muted">{state.kind === "starting" ? "Iniciando câmera…" : "A câmera será usada somente para ler o QR."}</p> : <p className="absolute inset-x-5 bottom-5 border-t-2 border-gate-valid pt-3 text-center font-code text-xs uppercase tracking-[0.14em] text-gate-valid">Lendo QR…</p>}
      </div>
      {state.kind === "unsupported" ? <p className="mt-4 border-l-4 border-gate-used bg-gate-bg p-4 text-sm text-gate-used" role="status">Este navegador não oferece leitura de QR pela câmera. Use o código manual.</p> : null}
      {state.kind === "error" ? <p className="mt-4 border-l-4 border-gate-invalid bg-gate-bg p-4 text-sm text-gate-invalid" role="alert">{state.message}</p> : null}
      <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">
        <button className="bg-gate-valid px-5 py-3 text-sm font-semibold text-gate-bg hover:brightness-110 disabled:opacity-60" disabled={disabled || state.kind === "starting" || state.kind === "scanning"} onClick={startCamera} type="button">{state.kind === "starting" ? "Iniciando…" : "Usar câmera"}</button>
        {state.kind === "scanning" ? <button className="border border-gate-border px-5 py-3 text-sm font-semibold text-gate-text hover:bg-white/5" onClick={() => { stopCamera(); setState({ kind: "idle" }); }} type="button">Parar câmera</button> : null}
      </div>
    </section>
  );
}

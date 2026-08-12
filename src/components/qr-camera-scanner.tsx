"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  createFallbackQrDecoder,
  createNativeQrDecoder,
  createSingleTokenHandler,
  stopMediaStream,
} from "./qr-camera-decoder";

type CameraState =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "scanning" }
  | { kind: "unsupported" }
  | { kind: "error"; message: string };

const fallbackScanIntervalMs = 200;

export function getCameraErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "O acesso à câmera foi negado. Libere a permissão do navegador ou use o código manual.";
    }

    if (error.name === "NotFoundError") {
      return "Nenhuma câmera foi encontrada neste dispositivo. Use o código manual.";
    }
  }

  return "Não foi possível iniciar a câmera. Use o código manual.";
}

export function QrCameraScanner({
  disabled = false,
  onToken,
}: {
  disabled?: boolean;
  onToken: (token: string) => Promise<void>;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scanningRef = useRef(false);
  const lastFallbackScanRef = useRef(0);
  const [state, setState] = useState<CameraState>({ kind: "idle" });

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (canvasRef.current) {
      canvasRef.current.width = 0;
      canvasRef.current.height = 0;
    }
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  async function startCamera() {
    if (disabled || state.kind === "starting" || state.kind === "scanning") {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
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
        stopMediaStream(stream);
        return;
      }

      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      const nativeDecoder = await createNativeQrDecoder();
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }
      const decoder = nativeDecoder ?? createFallbackQrDecoder(canvasRef.current);
      const handleToken = createSingleTokenHandler(async (token) => {
        stopCamera();
        await onToken(token);
      });

      scanningRef.current = true;
      lastFallbackScanRef.current = 0;
      setState({ kind: "scanning" });

      const detectNextFrame = async () => {
        if (!scanningRef.current || !videoRef.current) {
          return;
        }

        const now = performance.now();
        const shouldScan =
          decoder.kind === "native" ||
          now - lastFallbackScanRef.current >= fallbackScanIntervalMs;

        if (shouldScan) {
          if (decoder.kind === "fallback") {
            lastFallbackScanRef.current = now;
          }

          try {
            const token = await decoder.decode(videoRef.current);

            if (token && (await handleToken(token))) {
              return;
            }
          } catch {
            // A frame sem leitura é normal; a câmera continua ativa.
          }
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
      {state.kind === "unsupported" ? <p className="mt-4 border-l-4 border-gate-used bg-gate-bg p-4 text-sm text-gate-used" role="status">Este navegador não oferece acesso à câmera. Use o código manual.</p> : null}
      {state.kind === "error" ? <p className="mt-4 border-l-4 border-gate-invalid bg-gate-bg p-4 text-sm text-gate-invalid" role="alert">{state.message}</p> : null}
      <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">
        <button className="bg-gate-valid px-5 py-3 text-sm font-semibold text-gate-bg hover:brightness-110 disabled:opacity-60" disabled={disabled || state.kind === "starting" || state.kind === "scanning"} onClick={startCamera} type="button">{state.kind === "starting" ? "Iniciando…" : "Usar câmera"}</button>
        {state.kind === "scanning" ? <button className="border border-gate-border px-5 py-3 text-sm font-semibold text-gate-text hover:bg-white/5" onClick={() => { stopCamera(); setState({ kind: "idle" }); }} type="button">Parar câmera</button> : null}
      </div>
    </section>
  );
}

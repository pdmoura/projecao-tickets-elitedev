"use client";

import { useEffect } from "react";

type AvailabilityToastProps = {
  action?: React.ReactNode;
  autoCloseMs?: number;
  message: string;
  onClose: () => void;
};

export function AvailabilityToast({
  action,
  autoCloseMs,
  message,
  onClose,
}: AvailabilityToastProps) {
  useEffect(() => {
    if (!autoCloseMs) {
      return;
    }

    const timeoutId = window.setTimeout(onClose, autoCloseMs);

    return () => window.clearTimeout(timeoutId);
  }, [autoCloseMs, message, onClose]);

  return (
    <div
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl border border-warning bg-surface p-4 shadow-[0_18px_45px_rgba(20,20,20,0.16)] sm:right-6 sm:left-auto sm:mx-0"
      role="status"
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 text-sm leading-6 text-ink">{message}</p>
        <button
          aria-label="Fechar aviso de disponibilidade"
          className="shrink-0 px-1 text-lg leading-none text-ink-muted hover:text-ink"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";

type DeleteOrganizerDraftButtonProps = {
  compact?: boolean;
  eventId: string;
  label?: string;
};

export function DeleteOrganizerDraftButton({ compact = false, eventId, label = "Excluir" }: DeleteOrganizerDraftButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deleteButtonRef = useRef<HTMLButtonElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const triggerButton = deleteButtonRef.current;
    cancelButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      triggerButton?.focus();
    };
  }, [isOpen]);

  async function deleteDraft() {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/organizer/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: { message?: string } };
        throw new Error(payload.error?.message ?? "Não foi possível excluir a sessão.");
      }

      setIsOpen(false);
      router.push("/organizer?deleted=1");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível excluir o rascunho.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        aria-label={label}
        className={compact
          ? "inline-flex size-10 cursor-pointer items-center justify-center border border-error text-error transition-colors hover:bg-error/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
          : "inline-flex cursor-pointer items-center justify-center gap-2 border border-error px-4 py-3 text-sm font-semibold text-error transition-colors hover:bg-error hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"}
        onClick={() => setIsOpen(true)}
        ref={deleteButtonRef}
        title={compact ? label : undefined}
        type="button"
      >
        <Trash2 aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
        {compact ? <span className="sr-only">{label}</span> : label}
      </button>
      {isOpen ? (
        <div aria-labelledby="delete-draft-title" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4" role="dialog">
          <div className="w-full max-w-md border border-rule bg-paper p-6 shadow-2xl">
            <h2 className="font-display text-3xl" id="delete-draft-title">Excluir sessão?</h2>
            <p className="mt-4 leading-7 text-ink-muted">
              Esta sessão não possui histórico transacional. Esta ação não pode ser desfeita.
            </p>
            {error ? <p className="mt-4 text-sm text-error" role="alert">{error}</p> : null}
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="cursor-pointer border border-rule px-4 py-3 text-sm font-semibold hover:bg-surface-secondary disabled:cursor-not-allowed"
                disabled={isDeleting}
                onClick={() => setIsOpen(false)}
                ref={cancelButtonRef}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="cursor-pointer bg-error px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isDeleting}
                onClick={deleteDraft}
                type="button"
              >
                {isDeleting ? "Excluindo…" : "Excluir sessão"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setIsVisible(window.scrollY > 480);

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <button
      aria-label="Voltar ao topo"
      className="fixed bottom-5 right-5 z-50 grid size-11 place-items-center border border-ink bg-paper text-lg shadow-[0_10px_24px_rgba(20,20,20,0.14)] transition hover:bg-accent sm:bottom-7 sm:right-7"
      onClick={() => window.scrollTo({ behavior: "smooth", top: 0 })}
      type="button"
    >
      <span aria-hidden="true">↑</span>
    </button>
  );
}

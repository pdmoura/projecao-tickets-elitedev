"use client";

import { useEffect } from "react";

const howItWorksHash = "#como-funciona";

export function HomeHashScroll() {
  useEffect(() => {
    function scrollToHowItWorks() {
      if (window.location.hash !== howItWorksHash) {
        return;
      }

      window.requestAnimationFrame(() => {
        document.getElementById("como-funciona")?.scrollIntoView({ block: "start" });
      });
    }

    scrollToHowItWorks();
    window.addEventListener("hashchange", scrollToHowItWorks);

    return () => window.removeEventListener("hashchange", scrollToHowItWorks);
  }, []);

  return null;
}

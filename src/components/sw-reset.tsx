"use client";

import { useEffect } from "react";

// Kill any old service worker to avoid stale offline caches
export function SwReset() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations?.().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
    }
  }, []);
  return null;
}

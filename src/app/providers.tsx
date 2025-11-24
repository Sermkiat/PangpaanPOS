"use client";

import React, { useEffect } from "react";
import { usePosStore } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    usePosStore.getState().initFromApi().catch((err) => console.error("init store failed", err));

    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      // Unregister any existing service workers to avoid stale cache issues
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((reg) => reg.unregister()))
        .catch((err) => console.warn("SW unregister failed", err));
    }
  }, []);

  return <>{children}</>;
}

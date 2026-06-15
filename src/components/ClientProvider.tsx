"use client";

import { useEffect } from "react";
import { useStudyStore } from "@/lib/store";

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    useStudyStore.getState().checkAndResetToday();

    // Register service worker for PWA
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/wzj-word-memory/sw.js").catch(() => {});
    }
  }, []);

  return <>{children}</>;
}

"use client";

import { useEffect } from "react";

// Înregistrează service worker-ul ca aplicația să fie instalabilă (PWA).
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return; // evită cache-ul în dev

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // înregistrarea poate eșua în unele medii — nu e critic
      });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}

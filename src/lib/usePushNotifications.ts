"use client";

import { useCallback, useEffect, useState } from "react";

// Convertește cheia VAPID (base64url) în Uint8Array, cum cere PushManager.
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type Status = "unsupported" | "denied" | "off" | "on" | "loading";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function isSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function usePushNotifications() {
  const [status, setStatus] = useState<Status>("loading");

  // Stare inițială: suportat? permisiune? deja abonat?
  useEffect(() => {
    if (!isSupported() || !VAPID) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    // Nu folosim serviceWorker.ready (se blochează dacă niciun SW nu e activ).
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.pushManager.getSubscription() ?? null)
      .then((sub) => setStatus(sub ? "on" : "off"))
      .catch(() => setStatus("off"));
  }, []);

  // Abonează: cere permisiune, înregistrează SW, creează subscription, trimite la server.
  const subscribe = useCallback(async (savedEventIds: string[]) => {
    if (!isSupported() || !VAPID) return false;
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return false;
      }

      const reg =
        (await navigator.serviceWorker.getRegistration()) ??
        (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          savedEventIds,
          wantsGeneral: true,
          wantsReminders: true,
        }),
      });
      if (!res.ok) throw new Error("subscribe failed");
      setStatus("on");
      return true;
    } catch {
      setStatus("off");
      return false;
    }
  }, []);

  // Dezabonează: scoate subscription-ul local + șterge din server.
  const unsubscribe = useCallback(async () => {
    if (!isSupported()) return;
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch {
      setStatus("off");
    }
  }, []);

  // Re-sincronizează lista de evenimente salvate cu serverul (fără a recere permisiune).
  const syncSavedIds = useCallback(
    async (savedEventIds: string[]) => {
      if (status !== "on") return;
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        if (!sub) return;
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON(), savedEventIds }),
        });
      } catch {
        // best-effort
      }
    },
    [status]
  );

  return { status, subscribe, unsubscribe, syncSavedIds };
}

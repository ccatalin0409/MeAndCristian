"use client";

import { useEffect, useRef } from "react";
import { usePushNotifications } from "@/lib/usePushNotifications";
import { useSavedEvents } from "@/lib/useSavedEvents";

export default function PushToggle() {
  const { status, subscribe, unsubscribe, syncSavedIds } = usePushNotifications();
  const { ids } = useSavedEvents();
  const idList = [...ids];
  const lastSynced = useRef("");

  // Când lista de salvate se schimbă și suntem abonați, re-sincronizăm cu serverul
  // ca reminderele personalizate să fie la zi.
  useEffect(() => {
    if (status !== "on") return;
    const key = idList.slice().sort().join(",");
    if (key === lastSynced.current) return;
    lastSynced.current = key;
    syncSavedIds(idList);
  }, [status, idList, syncSavedIds]);

  const busy = status === "loading";

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="font-medium">Notificări</p>
        <p className="text-sm text-muted">
          {status === "unsupported"
            ? "Browserul tău nu suportă notificări push"
            : status === "denied"
            ? "Blocate — activează-le din setările browserului"
            : "Remindere pentru evenimentele salvate + ce e diseară în oraș"}
        </p>
      </div>

      {status === "unsupported" || status === "denied" ? (
        <span className="shrink-0 text-sm text-muted">Indisponibil</span>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => (status === "on" ? unsubscribe() : subscribe(idList))}
          aria-pressed={status === "on"}
          className={`shrink-0 relative inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:opacity-50 ${
            status === "on" ? "bg-primary" : "bg-border"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              status === "on" ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      )}
    </div>
  );
}

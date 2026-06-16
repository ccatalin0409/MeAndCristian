"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const KEY = "cfio_saved_events";

// Salvările funcționează imediat prin localStorage (merge și fără cont).
// Dacă userul e logat în Supabase, se sincronizează și în DB (tabelul saved_events).
export function useSavedEvents() {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 1) încarcă din localStorage
    let local: string[] = [];
    try {
      local = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    } catch {
      local = [];
    }
    setIds(new Set(local));
    setReady(true);

    // 2) dacă există sesiune Supabase, adu și salvările din DB și fuzionează
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from("saved_events")
        .select("event_id")
        .then(({ data: rows }) => {
          if (!rows) return;
          setIds((prev) => {
            const merged = new Set(prev);
            rows.forEach((r: { event_id: string }) => merged.add(r.event_id));
            persist(merged);
            return merged;
          });
        });
    });
  }, []);

  const persist = (set: Set<string>) => {
    try {
      localStorage.setItem(KEY, JSON.stringify([...set]));
    } catch {
      // ignore
    }
  };

  const toggle = useCallback(async (eventId: string) => {
    let nowSaved = false;
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
        nowSaved = false;
      } else {
        next.add(eventId);
        nowSaved = true;
      }
      persist(next);
      return next;
    });

    // best-effort sync în DB
    const supabase = createClient();
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    if (nowSaved) {
      await supabase
        .from("saved_events")
        .upsert({ user_id: data.user.id, event_id: eventId });
    } else {
      await supabase
        .from("saved_events")
        .delete()
        .eq("user_id", data.user.id)
        .eq("event_id", eventId);
    }
  }, []);

  return { ids, ready, isSaved: (id: string) => ids.has(id), toggle };
}

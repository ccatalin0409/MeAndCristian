// Deduplicare cross-sursă, auto-vindecătoare. Rulează la finalul fiecărei
// ingestii: grupează evenimentele pe amprentă (titlu normalizat + ziua + oraș)
// și păstrează un singur exemplar — cel din sursa „mai bună" (cu link de bilete
// și preț real). Reprezentațiile la ore diferite au titluri diferite → rămân.

import type { SupabaseClient } from "@supabase/supabase-js";

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // diacritice
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Prioritate între surse-scraper (mai sus = preferat). iaBilet are link de
// bilete + preț real, deci câștigă în fața agregatoarelor.
const SCRAPER_PRIORITY = ["iaBilet", "OneEvent", "Songkick", "Teatrul Odeon"];

// Surse „umane" — nu le ștergem niciodată automat.
const PROTECTED_TYPES = new Set(["manual", "user_submitted", "partner"]);

interface Row {
  id: string;
  title: string;
  starts_at: string;
  city_id: string | null;
  ticket_url: string | null;
  price_min: number | null;
  source: { name: string; type: string } | null;
}

// Scor mai mare = exemplar preferat (păstrat).
function score(r: Row): number {
  let s = 0;
  if (PROTECTED_TYPES.has(r.source?.type ?? "")) s += 1000;
  const idx = SCRAPER_PRIORITY.indexOf(r.source?.name ?? "");
  if (idx !== -1) s += (SCRAPER_PRIORITY.length - idx) * 10;
  if (r.ticket_url) s += 3;
  if (r.price_min != null) s += 2;
  return s;
}

export async function dedupeEvents(
  db: SupabaseClient
): Promise<{ removed: number; groups: number }> {
  const { data, error } = await db
    .from("events")
    .select(
      "id, title, starts_at, city_id, ticket_url, price_min, source:sources(name, type)"
    );
  if (error) throw error;
  const rows = (data ?? []) as unknown as Row[];

  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    if (!r.title || !r.starts_at) continue;
    const key = `${norm(r.title)}|${r.starts_at.slice(0, 10)}|${r.city_id ?? ""}`;
    const g = groups.get(key);
    if (g) g.push(r);
    else groups.set(key, [r]);
  }

  const loserIds: string[] = [];
  let dupGroups = 0;
  for (const g of groups.values()) {
    if (g.length < 2) continue;
    dupGroups++;
    g.sort((a, b) => score(b) - score(a));
    for (let k = 1; k < g.length; k++) loserIds.push(g[k].id);
  }

  // Ștergem în loturi (cascadează în saved_events).
  for (let i = 0; i < loserIds.length; i += 100) {
    const { error: delErr } = await db
      .from("events")
      .delete()
      .in("id", loserIds.slice(i, i + 100));
    if (delErr) throw delErr;
  }

  return { removed: loserIds.length, groups: dupGroups };
}

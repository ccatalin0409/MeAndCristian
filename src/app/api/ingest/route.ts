// Rută de ingestie programată — pentru Vercel Cron sau apel manual.
// Protejată cu CRON_SECRET. Exemple:
//   GET /api/ingest?secret=...           (toate sursele)
//   GET /api/ingest?secret=...&source=iabilet
//
// Vercel Cron trimite automat header-ul „Authorization: Bearer <CRON_SECRET>".

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ADAPTERS, getAdapter } from "@/lib/ingest/sources";
import { ingestEvents } from "@/lib/ingest/upsert";
import { dedupeEvents } from "@/lib/ingest/dedupe";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const provided =
    url.searchParams.get("secret") ??
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Supabase neconfigurat (lipsește service role key)" },
      { status: 500 }
    );
  }

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const sourceKey = url.searchParams.get("source");
  const adapters = sourceKey
    ? [getAdapter(sourceKey)].filter(Boolean)
    : ADAPTERS;

  if (!adapters.length) {
    return NextResponse.json({ error: "Sursă necunoscută" }, { status: 400 });
  }

  const results = [];
  for (const adapter of adapters) {
    try {
      const raw = await adapter!.fetchEvents({ maxPages: 1 });
      // geocode dezactivat în cron (e lent); coordonatele vin din venue-uri cunoscute.
      const stats = await ingestEvents(db, adapter!, raw, {
        status: "published",
        geocode: false,
      });
      results.push(stats);
    } catch (e) {
      results.push({ source: adapter!.key, error: (e as Error).message });
    }
  }

  // Dedup cross-sursă doar când rulăm toate sursele (nu la o sursă singură).
  let dedup: { removed: number; groups: number } | { error: string } | null =
    null;
  if (!sourceKey) {
    try {
      dedup = await dedupeEvents(db);
    } catch (e) {
      dedup = { error: (e as Error).message };
    }
  }

  return NextResponse.json({ ok: true, results, dedup });
}

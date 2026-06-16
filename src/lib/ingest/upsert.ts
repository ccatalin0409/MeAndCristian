// Normalizare + deduplicare + upsert al evenimentelor brute în Supabase.
// Rezolvă orașul, sursa, categoria și locul (cu coordonate) înainte de scriere.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { IngestStats, RawEvent, SourceAdapter } from "./types";
import { VENUES as KNOWN_VENUES } from "../data/seed";
import { geocode } from "./geocode";

export interface IngestOptions {
  status?: "draft" | "published" | "hidden";
  geocode?: boolean; // geocodează locurile noi (Nominatim) — implicit true
  dryRun?: boolean;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // elimină diacriticele
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Caută coordonate cunoscute pentru un venue din datele seed (venue-uri mari).
function knownCoords(name: string): { lat: number; lng: number } | null {
  const n = norm(name);
  for (const v of KNOWN_VENUES) {
    const vn = norm(v.name);
    if ((vn === n || n.includes(vn) || vn.includes(n)) && v.lat && v.lng) {
      return { lat: v.lat, lng: v.lng };
    }
  }
  return null;
}

export async function ingestEvents(
  db: SupabaseClient,
  adapter: SourceAdapter,
  rawEvents: RawEvent[],
  opts: IngestOptions = {}
): Promise<IngestStats> {
  const status = opts.status ?? "published";
  const doGeocode = opts.geocode ?? true;
  const stats: IngestStats = {
    source: adapter.key,
    fetched: rawEvents.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };
  if (rawEvents.length === 0) return stats;

  // 1) Oraș
  const citySlug = rawEvents[0].citySlug;
  const { data: city } = await db
    .from("cities")
    .select("id")
    .eq("slug", citySlug)
    .maybeSingle();
  if (!city) {
    throw new Error(
      `Orașul "${citySlug}" nu există în DB. Rulează întâi: npm run seed`
    );
  }
  const cityId = city.id as string;

  // 2) Sursă (lookup după nume, altfel insert)
  let sourceId: string;
  const { data: existingSrc } = await db
    .from("sources")
    .select("id")
    .eq("name", adapter.label)
    .limit(1);
  if (existingSrc && existingSrc.length) {
    sourceId = existingSrc[0].id;
    await db
      .from("sources")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", sourceId);
  } else {
    const { data: ins, error } = await db
      .from("sources")
      .insert({
        name: adapter.label,
        type: adapter.type,
        url: adapter.url ?? null,
        last_synced_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw error;
    sourceId = ins.id;
  }

  // 3) Categorii: slug -> id
  const { data: cats } = await db.from("categories").select("id, slug");
  const catIdBySlug = new Map<string, string>(
    (cats ?? []).map((c: { id: string; slug: string }) => [c.slug, c.id])
  );

  // 4) Care external_id-uri există deja (ca să numărăm inserted vs updated)
  const { data: existingEvents } = await db
    .from("events")
    .select("external_id")
    .eq("source_id", sourceId);
  const existingIds = new Set(
    (existingEvents ?? []).map((e: { external_id: string }) => e.external_id)
  );

  // 5) Cache venue: nume normalizat -> id
  const venueCache = new Map<string, string>();

  async function resolveVenue(
    name: string | null,
    address: string | null
  ): Promise<string | null> {
    if (!name) return null;
    const key = norm(name);
    if (venueCache.has(key)) return venueCache.get(key)!;

    // există deja în DB?
    const { data: found } = await db
      .from("venues")
      .select("id, lat, lng")
      .ilike("name", name)
      .eq("city_id", cityId)
      .limit(1);
    if (found && found.length) {
      venueCache.set(key, found[0].id);
      // completează coordonatele dacă lipsesc
      if ((found[0].lat == null || found[0].lng == null)) {
        const coords =
          knownCoords(name) ||
          (doGeocode && address ? await geocode(address) : null);
        if (coords) {
          await db
            .from("venues")
            .update({ lat: coords.lat, lng: coords.lng })
            .eq("id", found[0].id);
        }
      }
      return found[0].id;
    }

    // creează venue nou
    const coords =
      knownCoords(name) ||
      (doGeocode && address ? await geocode(address) : null);
    const { data: ins, error } = await db
      .from("venues")
      .insert({
        city_id: cityId,
        name,
        address,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      })
      .select("id")
      .single();
    if (error) {
      console.warn("venue insert:", error.message);
      return null;
    }
    venueCache.set(key, ins.id);
    return ins.id;
  }

  // 6) Upsert evenimente
  for (const ev of rawEvents) {
    try {
      const venueId = await resolveVenue(ev.venueName, ev.venueAddress);
      const row = {
        city_id: cityId,
        venue_id: venueId,
        title: ev.title,
        description: ev.description,
        category_id: ev.categorySlug
          ? catIdBySlug.get(ev.categorySlug) ?? null
          : null,
        starts_at: ev.startsAt,
        ends_at: ev.endsAt,
        is_free: ev.isFree,
        price_min: ev.priceMin,
        price_max: ev.priceMax,
        image_url: ev.imageUrl,
        ticket_url: ev.ticketUrl,
        source_id: sourceId,
        external_id: ev.externalId,
        status,
      };

      if (opts.dryRun) {
        existingIds.has(ev.externalId) ? stats.updated++ : stats.inserted++;
        continue;
      }

      const { error } = await db
        .from("events")
        .upsert(row, { onConflict: "source_id,external_id" });
      if (error) {
        console.warn(`upsert "${ev.title}":`, error.message);
        stats.errors++;
        continue;
      }
      existingIds.has(ev.externalId) ? stats.updated++ : stats.inserted++;
    } catch (e) {
      console.warn(`eroare la "${ev.title}":`, (e as Error).message);
      stats.errors++;
    }
  }

  return stats;
}

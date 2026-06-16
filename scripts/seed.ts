// Populează Supabase cu orașe, categorii, localuri și evenimente demo.
//
// Rulează: npm run seed
// Necesită în .env.local: NEXT_PUBLIC_SUPABASE_URL și SUPABASE_SERVICE_ROLE_KEY.

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  CATEGORIES,
  CITIES,
  VENUES,
  getSeedEvents,
} from "../src/lib/data/seed";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Lipsesc NEXT_PUBLIC_SUPABASE_URL sau SUPABASE_SERVICE_ROLE_KEY din .env.local"
  );
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

async function main() {
  // 1) Orașe (upsert pe slug)
  const { data: cityRows, error: cityErr } = await db
    .from("cities")
    .upsert(
      CITIES.map((c) => ({
        name: c.name,
        slug: c.slug,
        lat: c.lat,
        lng: c.lng,
        timezone: c.timezone,
      })),
      { onConflict: "slug" }
    )
    .select();
  if (cityErr) throw cityErr;
  const cityIdBySlug = new Map(cityRows!.map((c) => [c.slug, c.id]));
  console.log(`✓ ${cityRows!.length} orașe`);

  // 2) Categorii (upsert pe slug)
  const { data: catRows, error: catErr } = await db
    .from("categories")
    .upsert(
      CATEGORIES.map((c) => ({ name: c.name, slug: c.slug })),
      { onConflict: "slug" }
    )
    .select();
  if (catErr) throw catErr;
  const catIdBySlug = new Map(catRows!.map((c) => [c.slug, c.id]));
  console.log(`✓ ${catRows!.length} categorii`);

  // 3) Sursă „manual"
  const { data: srcRows, error: srcErr } = await db
    .from("sources")
    .upsert([{ name: "Manual (admin)", type: "manual" }], {
      onConflict: "name",
      ignoreDuplicates: false,
    })
    .select();
  // „name" nu e unic în schemă; dacă pică upsert-ul, luăm/inserăm simplu.
  let manualSourceId: string | null = null;
  if (!srcErr && srcRows && srcRows.length) {
    manualSourceId = srcRows[0].id;
  } else {
    const { data: existing } = await db
      .from("sources")
      .select("id")
      .eq("name", "Manual (admin)")
      .limit(1);
    if (existing && existing.length) manualSourceId = existing[0].id;
    else {
      const { data: ins } = await db
        .from("sources")
        .insert([{ name: "Manual (admin)", type: "manual" }])
        .select();
      manualSourceId = ins?.[0]?.id ?? null;
    }
  }
  console.log("✓ sursă manuală");

  // 4) Localuri (upsert pe name — atenție: aici e simplu, fără constrângere unică,
  //    deci ștergem și reinserăm ca să fie idempotent în demo)
  const bucurestiId = cityIdBySlug.get("bucuresti")!;
  const venueIdBySlug = new Map<string, string>();
  for (const v of VENUES) {
    const { data: existing } = await db
      .from("venues")
      .select("id")
      .eq("name", v.name)
      .limit(1);
    if (existing && existing.length) {
      venueIdBySlug.set(v.id, existing[0].id);
      await db
        .from("venues")
        .update({
          address: v.address,
          lat: v.lat,
          lng: v.lng,
          website: v.website,
          is_partner: v.is_partner,
          city_id: bucurestiId,
        })
        .eq("id", existing[0].id);
    } else {
      const { data: ins, error } = await db
        .from("venues")
        .insert([
          {
            city_id: bucurestiId,
            name: v.name,
            address: v.address,
            lat: v.lat,
            lng: v.lng,
            website: v.website,
            is_partner: v.is_partner,
          },
        ])
        .select();
      if (error) throw error;
      venueIdBySlug.set(v.id, ins![0].id);
    }
  }
  console.log(`✓ ${VENUES.length} localuri`);

  // 5) Evenimente (upsert pe (source_id, external_id))
  const events = getSeedEvents().map((e) => ({
    city_id: bucurestiId,
    venue_id: e.venue_id ? venueIdBySlug.get(e.venue_id) ?? null : null,
    title: e.title,
    description: e.description,
    category_id: e.category_id ? catIdBySlug.get(e.category_id) ?? null : null,
    starts_at: e.starts_at,
    ends_at: e.ends_at,
    is_free: e.is_free,
    price_min: e.price_min,
    price_max: e.price_max,
    is_family_friendly: e.is_family_friendly,
    image_url: e.image_url,
    ticket_url: e.ticket_url,
    source_id: manualSourceId,
    external_id: e.external_id,
    status: "published",
    is_promoted: e.is_promoted,
  }));

  const { error: evErr } = await db
    .from("events")
    .upsert(events, { onConflict: "source_id,external_id" });
  if (evErr) throw evErr;
  console.log(`✓ ${events.length} evenimente`);

  console.log("\nGata. Datele demo sunt în Supabase.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

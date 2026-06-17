import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { politeFetch } from "../src/lib/ingest/http";
import { extractEvents } from "../src/lib/ingest/jsonld";

config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data } = await sb
    .from("events")
    .select("title, description, ticket_url, is_free, price_min, price_max, source:sources(name)")
    .ilike("title", "%Cenaclul Mariana Marin%")
    .limit(1);
  const e = (data ?? [])[0] as any;
  if (!e) {
    console.log("Nu am găsit evenimentul.");
    return;
  }
  console.log("=== CE AVEM NOI ÎN DB ===");
  console.log("titlu:", e.title);
  console.log("sursa:", e.source?.name, "| ticket_url:", e.ticket_url);
  console.log("is_free:", e.is_free, "| price_min:", e.price_min, "| price_max:", e.price_max);
  console.log("descriere (lungime " + (e.description?.length ?? 0) + "):");
  console.log("  ", (e.description ?? "(null)").slice(0, 400));

  if (!e.ticket_url) return;
  console.log("\n=== CE E PE PAGINA SURSĂ ===");
  try {
    const html = await politeFetch(e.ticket_url);
    const evs = extractEvents(html) as any[];
    const ld = evs.find((x) => x.name) ?? evs[0];
    console.log("JSON-LD de pe pagina de detaliu:");
    console.log("  offers:", JSON.stringify(ld?.offers));
    console.log("  description (lungime " + (ld?.description?.length ?? 0) + "):");
    console.log("   ", (ld?.description ?? "(null)").slice(0, 400));
    // căutăm semnale în tot HTML-ul paginii
    const hay = html.toLowerCase();
    for (const w of ["intrare liber", "intrare gratuit", "gratuit", "gratis", "sold out", "epuizat", "stoc epuizat", "indisponibil"]) {
      if (hay.includes(w)) console.log(`  ⚑ pagina conține: "${w}"`);
    }
  } catch (err) {
    console.log("eroare fetch:", (err as Error).message);
  }
}

main();

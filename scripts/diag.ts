import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { guessCategory } from "../src/lib/ingest/categorize";

config({ path: ".env.local" });
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Songkick are defaultCategory "concerte" când guessCategory dă null.
const DEFAULTS: Record<string, string> = { Songkick: "concerte", "Teatrul Odeon": "teatru" };

async function main() {
  const { data } = await sb
    .from("events")
    .select("title, description, source:sources(name)")
    .order("title");
  const rows = (data ?? []) as any[];

  const dist: Record<string, number> = {};
  const nullTitles: string[] = [];
  for (const e of rows) {
    let c = guessCategory(e.title, e.description);
    if (!c) c = DEFAULTS[e.source?.name] ?? null;
    const key = c ?? "—NULL—";
    dist[key] = (dist[key] ?? 0) + 1;
    if (!c) nullTitles.push(e.title.slice(0, 60));
  }

  console.log("=== DISTRIBUȚIE NOUĂ ===");
  for (const k of Object.keys(dist).sort((a, b) => dist[b] - dist[a]))
    console.log(`  ${String(dist[k]).padStart(3)}  ${k}`);

  console.log("\n=== CAZURI DE CONTROL ===");
  const checks = [
    "Greatest Tits", "ZooTonic", "IOTA 5", "Curs de prim ajutor AVANSAT",
    "Drumetie 6 zile", "Bonnie Tyler", "Rita Ora", "Danko Jones",
    "AntiPORTRET DE FAMILIE", "Street Food", "Povestea Scufiței", "Workshop de dans Kathak",
  ];
  for (const q of checks) {
    const e = rows.find((r) => r.title.toLowerCase().includes(q.toLowerCase()));
    if (e) {
      let c = guessCategory(e.title, e.description);
      if (!c) c = DEFAULTS[e.source?.name] ?? null;
      console.log(`  ${(c ?? "NULL").padEnd(10)} ← ${e.title.slice(0, 50)}`);
    }
  }

  console.log(`\n=== RĂMÂN NULL (${nullTitles.length}) ===`);
  nullTitles.forEach((t) => console.log("  " + t));
}
main();

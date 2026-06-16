// Runner de ingestie: trage evenimente din surse și le upsertează în Supabase.
//
// Exemple:
//   npm run ingest                      # toate sursele, status published
//   npm run ingest iabilet              # doar iaBilet
//   npm run ingest iabilet --dry        # preview, fără scriere
//   npm run ingest -- --status=draft    # importă ca draft (le aprobi din admin)
//   npm run ingest iabilet --max-pages=3
//   npm run ingest -- --no-geocode

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { ADAPTERS, getAdapter } from "../src/lib/ingest/sources";
import { ingestEvents } from "../src/lib/ingest/upsert";
import type { SourceAdapter } from "../src/lib/ingest/types";

config({ path: ".env.local" });

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (const a of argv) {
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      flags[k] = v ?? true;
    } else {
      positional.push(a);
    }
  }
  return { positional, flags };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Lipsesc NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY din .env.local"
    );
    process.exit(1);
  }

  const { positional, flags } = parseArgs(process.argv.slice(2));
  const dryRun = Boolean(flags.dry);
  const geocode = flags["no-geocode"] ? false : true;
  const status =
    (flags.status as "draft" | "published" | "hidden") ?? "published";
  const maxPages = flags["max-pages"] ? Number(flags["max-pages"]) : 1;

  let adapters: SourceAdapter[];
  if (positional.length) {
    adapters = positional
      .map((k) => {
        const a = getAdapter(k);
        if (!a) console.warn(`Sursă necunoscută: ${k}`);
        return a;
      })
      .filter(Boolean) as SourceAdapter[];
  } else {
    adapters = ADAPTERS;
  }

  if (!adapters.length) {
    console.error("Nicio sursă de rulat. Surse disponibile:", ADAPTERS.map((a) => a.key).join(", "));
    process.exit(1);
  }

  const db = createClient(url, serviceKey, { auth: { persistSession: false } });

  console.log(
    `\n▶ Ingestie ${dryRun ? "(DRY RUN) " : ""}— status=${status}, geocode=${geocode}, maxPages=${maxPages}\n`
  );

  for (const adapter of adapters) {
    process.stdout.write(`• ${adapter.label} … `);
    try {
      const raw = await adapter.fetchEvents({ maxPages });
      const stats = await ingestEvents(db, adapter, raw, {
        status,
        geocode,
        dryRun,
      });
      console.log(
        `${stats.fetched} găsite → ${stats.inserted} noi, ${stats.updated} actualizate, ${stats.errors} erori`
      );
    } catch (e) {
      console.log(`EROARE: ${(e as Error).message}`);
    }
  }

  console.log(dryRun ? "\n✓ Dry run gata (nimic scris).\n" : "\n✓ Gata.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

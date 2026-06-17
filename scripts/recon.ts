// Recon rapid: pentru o listă de URL-uri, raportează câte evenimente JSON-LD
// (schema.org/Event) au și exemple de date viitoare. Folosește parserul real
// din pipeline-ul de ingestie. Rulează: npx tsx scripts/recon.ts
import { politeFetch } from "../src/lib/ingest/http";
import { extractEvents } from "../src/lib/ingest/jsonld";

const CANDIDATES: string[] = [
  // Teatre
  "https://www.tnb.ro/ro/spectacole",
  "https://bulandra.ro/",
  "https://teatrulmic.ro/program/",
  "https://nottara.ro/spectacole/",
  "https://teatrul-excelsior.ro/",
  "https://teatrulmetropolis.ro/spectacole/",
  "https://godot.ro/",
  "https://www.teatruldecomedie.ro/",
  "https://teatrelli.ro/",
  "https://arcub.ro/evenimente/",
  // Comedy
  "https://club99.ro/",
  "https://comicsclub.ro/",
  // Cluburi / live
  "https://control-club.ro/",
  "https://expirat.org/",
  "https://quantic.ro/",
  "https://www.fabrica.ro/",
  "https://formspace.ro/",
  // Săli mari / clasică
  "https://www.fge.org.ro/",
  "https://sala-radio.ro/",
  "https://operanb.ro/",
  // Muzee / cultură
  "https://www.mnac.ro/",
  // Expo
  "https://www.romexpo.ro/",
];

const now = Date.now();

async function main() {
  for (const url of CANDIDATES) {
    try {
      const html = await politeFetch(url);
      const evs = extractEvents(html) as Array<{ name?: string; startDate?: string }>;
      const withDate = evs.filter((e) => e.name && e.startDate);
      const upcoming = withDate.filter((e) => {
        const t = Date.parse(e.startDate!);
        return Number.isFinite(t) && t >= now - 36 * 3600 * 1000;
      });
      const sample = upcoming[0] || withDate[0];
      const tag =
        upcoming.length > 0 ? "✅" : withDate.length > 0 ? "⚠️ (vechi)" : "—";
      console.log(
        `${tag} ${url}\n     JSON-LD: ${evs.length} | cu dată: ${withDate.length} | viitoare: ${upcoming.length}` +
          (sample ? ` | ex: ${sample.startDate} ${sample.name?.slice(0, 50)}` : "")
      );
    } catch (e) {
      console.log(`✗ ${url}\n     ${(e as Error).message}`);
    }
  }
}

main();

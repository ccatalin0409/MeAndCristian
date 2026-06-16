// Registrul surselor de ingestie.
//
// Pentru a adăuga un venue care publică schema.org/Event în JSON-LD, adaugă o
// configurație în `EXPERIMENTAL` cu createJsonLdSource({ key, label, urls }).
// Dacă pagina nu are JSON-LD, adaptorul întoarce 0 evenimente (fără să strice nimic).

import type { SourceAdapter } from "../types";
import { iabilet } from "./iabilet";
import { createJsonLdSource } from "./jsonld-generic";

// Surse verificate că funcționează.
const VERIFIED: SourceAdapter[] = [iabilet];

// Surse experimentale (venue-uri care POATE au JSON-LD). Decomentează/adaugă după test.
const EXPERIMENTAL: SourceAdapter[] = [
  // Exemplu — verifică întâi cu: npm run ingest <key> --dry
  // createJsonLdSource({
  //   key: "control-club",
  //   label: "Control Club",
  //   urls: ["https://control-club.ro/events/"],
  // }),
];

export const ADAPTERS: SourceAdapter[] = [...VERIFIED, ...EXPERIMENTAL];

export function getAdapter(key: string): SourceAdapter | undefined {
  return ADAPTERS.find((a) => a.key === key);
}

export { createJsonLdSource };

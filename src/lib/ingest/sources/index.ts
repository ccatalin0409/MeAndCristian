// Registrul surselor de ingestie.
//
// Pentru a adăuga un venue care publică schema.org/Event în JSON-LD, adaugă o
// configurație în `EXPERIMENTAL` cu createJsonLdSource({ key, label, urls }).
// Dacă pagina nu are JSON-LD, adaptorul întoarce 0 evenimente (fără să strice nimic).

import type { SourceAdapter } from "../types";
import { iabilet } from "./iabilet";
import { createJsonLdSource } from "./jsonld-generic";

// Surse verificate că funcționează.
const VERIFIED: SourceAdapter[] = [
  iabilet,
  // OneEvent — agregator București, ~130 evenimente din toate categoriile (JSON-LD).
  createJsonLdSource({
    key: "onevent",
    label: "OneEvent",
    urls: ["https://www.onevent.ro/orase/bucuresti/"],
  }),
  // Songkick — concerte din zona București (JSON-LD MusicEvent).
  createJsonLdSource({
    key: "songkick",
    label: "Songkick",
    urls: ["https://www.songkick.com/metro-areas/31841-romania-bucharest"],
    defaultCategory: "concerte",
  }),
  // Teatrul Odeon publică schema.org/Event în JSON-LD pe homepage.
  createJsonLdSource({
    key: "teatrul-odeon",
    label: "Teatrul Odeon",
    urls: ["https://www.teatrul-odeon.ro/"],
    defaultCategory: "teatru",
  }),
];

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

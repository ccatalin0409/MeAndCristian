// Adaptor generic pentru orice sit care publică schema.org/Event în JSON-LD.
// Adaugi o sursă nouă doar cu o configurație (fără cod nou) — multe pagini de
// venue/organizator au deja aceste date structurate în HTML.

import type { RawEvent, SourceAdapter } from "../types";
import { politeFetch, sleep } from "../http";
import { extractEvents } from "../jsonld";
import { toBucharestISO } from "../datetime";
import { guessCategory } from "../categorize";

export interface JsonLdSourceConfig {
  key: string;
  label: string;
  urls: string[]; // una sau mai multe pagini de listare
  citySlug?: string; // implicit "bucuresti"
  defaultCategory?: string | null;
}

interface LdEvent {
  name?: string;
  url?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  image?: string | string[];
  location?: {
    name?: string;
    address?:
      | string
      | { streetAddress?: string; addressLocality?: string };
  } | Array<{ name?: string }>;
  offers?: { price?: string | number } | Array<{ price?: string | number }>;
}

function asOne<T>(v: T | T[] | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

function parsePrice(p: string | number | undefined): number | null {
  if (p == null) return null;
  const n =
    typeof p === "number"
      ? p
      : Number(p.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function externalId(url: string | undefined, name: string, start: string): string {
  if (url) {
    const m = url.match(/-(\d+)\/?(?:[?#].*)?$/) || url.match(/\/(\d+)\/?$/);
    if (m) return m[1];
    return url;
  }
  // fără URL: cheie stabilă din nume + dată
  return `${name}-${start}`.toLowerCase().replace(/\s+/g, "-").slice(0, 120);
}

export function createJsonLdSource(config: JsonLdSourceConfig): SourceAdapter {
  const citySlug = config.citySlug ?? "bucuresti";

  return {
    key: config.key,
    label: config.label,
    type: "scraper",
    url: config.urls[0],

    async fetchEvents(): Promise<RawEvent[]> {
      const seen = new Set<string>();
      const out: RawEvent[] = [];

      for (let i = 0; i < config.urls.length; i++) {
        let html: string;
        try {
          html = await politeFetch(config.urls[i]);
        } catch (e) {
          console.warn(
            `${config.key}: nu am putut citi ${config.urls[i]}:`,
            (e as Error).message
          );
          continue;
        }

        for (const ld of extractEvents(html) as LdEvent[]) {
          if (!ld.name || !ld.startDate) continue;
          const startsAt = toBucharestISO(ld.startDate);
          if (!startsAt) continue;

          const id = externalId(ld.url, ld.name, ld.startDate);
          if (seen.has(id)) continue;
          seen.add(id);

          const place = asOne(
            ld.location as { name?: string; address?: unknown } | Array<{ name?: string }>
          );
          const addr = place && "address" in place ? place.address : undefined;
          const venueAddress =
            typeof addr === "string"
              ? addr
              : addr && typeof addr === "object"
              ? [
                  (addr as { streetAddress?: string }).streetAddress,
                  (addr as { addressLocality?: string }).addressLocality,
                ]
                  .filter(Boolean)
                  .join(", ")
              : null;

          const price = parsePrice(asOne(ld.offers)?.price);
          const img = Array.isArray(ld.image) ? ld.image[0] : ld.image;

          out.push({
            source: config.key,
            externalId: id,
            // NFKC: convertește caractere „fancy" Unicode (𝐑𝐞𝐠𝐢𝐧𝐞 -> Regine);
            // apoi normalizează spațiile și taie ratingul de vârstă din coadă.
            title: ld.name
              .normalize("NFKC")
              .replace(/\s+/g, " ")
              .replace(/\s*\|\s*\d+\s*\+\s*$/, "")
              .trim(),
            description: ld.description?.trim() || null,
            ticketUrl: ld.url ?? config.urls[i],
            startsAt,
            endsAt: ld.endDate ? toBucharestISO(ld.endDate, 23) : null,
            imageUrl: img ?? null,
            priceMin: price,
            priceMax: price,
            isFree: price === 0,
            venueName: place?.name?.trim() || config.label,
            venueAddress: venueAddress || null,
            citySlug,
            categorySlug:
              guessCategory(ld.name, ld.description ?? null) ??
              config.defaultCategory ??
              null,
          });
        }

        if (i < config.urls.length - 1) await sleep(1500);
      }

      return out;
    },
  };
}

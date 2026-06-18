// Adaptor iaBilet — cea mai mare platformă de bilete din România.
// Sursa de date: tag-urile JSON-LD (schema.org/Event) de pe pagina de listare București.
// robots.txt permite /bilete-bucuresti/ și paginile de eveniment (verificat).

import type { RawEvent, SourceAdapter } from "../types";
import { politeFetch, sleep } from "../http";
import { extractEvents } from "../jsonld";
import { toBucharestISO } from "../datetime";
import { guessCategory } from "../categorize";
import { resolvePricing } from "../pricing";
import { cleanText, cleanTitle } from "../text";

const BASE = "https://www.iabilet.ro";
const LISTING = `${BASE}/bilete-bucuresti/`;

interface LdPlace {
  name?: string;
  address?: { streetAddress?: string; addressLocality?: string };
}
interface LdOffer {
  price?: string | number;
  priceCurrency?: string;
}
interface LdEvent {
  name?: string;
  url?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  image?: string | string[];
  location?: LdPlace | LdPlace[];
  offers?: LdOffer | LdOffer[];
}

// "111,99" / "130" / 130 -> 111.99 / 130 ; gol -> null
function parsePrice(p: string | number | undefined): number | null {
  if (p == null) return null;
  const n =
    typeof p === "number"
      ? p
      : Number(p.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function firstImage(image: string | string[] | undefined): string | null {
  if (!image) return null;
  return Array.isArray(image) ? image[0] ?? null : image;
}

function firstPlace(loc: LdPlace | LdPlace[] | undefined): LdPlace | null {
  if (!loc) return null;
  return Array.isArray(loc) ? loc[0] ?? null : loc;
}

function firstOffer(o: LdOffer | LdOffer[] | undefined): LdOffer | null {
  if (!o) return null;
  return Array.isArray(o) ? o[0] ?? null : o;
}

// Extrage id-ul numeric din finalul URL-ului: /bilete-...-124832/ -> "124832"
function externalIdFromUrl(url: string): string | null {
  const m = url.match(/-(\d+)\/?(?:[?#].*)?$/);
  return m ? m[1] : null;
}

function mapEvent(ld: LdEvent): RawEvent | null {
  const url = ld.url?.trim();
  const title = cleanTitle(ld.name);
  if (!url || !title || !ld.startDate) return null;

  const externalId = externalIdFromUrl(url);
  if (!externalId) return null;

  const startsAt = toBucharestISO(ld.startDate);
  if (!startsAt) return null;

  const description = cleanText(ld.description);
  const place = firstPlace(ld.location);
  const offer = firstOffer(ld.offers);
  const pricing = resolvePricing({
    offerPrice: parsePrice(offer?.price),
    title,
    description,
  });
  const address = place?.address
    ? [place.address.streetAddress, place.address.addressLocality]
        .filter(Boolean)
        .join(", ")
    : null;

  return {
    source: "iabilet",
    externalId,
    title,
    description,
    ticketUrl: url,
    startsAt,
    endsAt: ld.endDate ? toBucharestISO(ld.endDate, 23) : null,
    imageUrl: firstImage(ld.image),
    priceMin: pricing.priceMin,
    priceMax: pricing.priceMax,
    isFree: pricing.isFree,
    venueName: place?.name?.trim() || null,
    venueAddress: address,
    citySlug: "bucuresti",
    categorySlug: guessCategory(title, description),
  };
}

async function enrichDescription(ev: RawEvent): Promise<void> {
  if (!ev.ticketUrl) return;
  try {
    const html = await politeFetch(ev.ticketUrl);
    const lds = extractEvents(html) as LdEvent[];
    const fullDesc = cleanText(lds[0]?.description);
    if (fullDesc && fullDesc.length > (ev.description?.length ?? 0)) {
      ev.description = fullDesc;
    }
  } catch {
    // pagina individuală indisponibilă — păstrăm descrierea din listing
  }
}

export const iabilet: SourceAdapter = {
  key: "iabilet",
  label: "iaBilet",
  type: "scraper",
  url: LISTING,

  async fetchEvents({ maxPages = 1 } = {}): Promise<RawEvent[]> {
    const seen = new Set<string>();
    const events: RawEvent[] = [];

    for (let page = 1; page <= maxPages; page++) {
      const pageUrl = page === 1 ? LISTING : `${LISTING}?pagina=${page}`;
      let html: string;
      try {
        html = await politeFetch(pageUrl);
      } catch (e) {
        console.warn(`iaBilet: nu am putut citi ${pageUrl}:`, (e as Error).message);
        break;
      }

      const lds = extractEvents(html) as LdEvent[];
      let addedThisPage = 0;
      for (const ld of lds) {
        const ev = mapEvent(ld);
        if (!ev) continue;
        if (seen.has(ev.externalId)) continue;
        seen.add(ev.externalId);
        events.push(ev);
        addedThisPage++;
      }

      if (addedThisPage === 0) break;
      if (page < maxPages) await sleep(1500);
    }

    // Îmbogățim descrierile cu cele complete de pe paginile individuale.
    for (let i = 0; i < events.length; i++) {
      await enrichDescription(events[i]);
      if (i < events.length - 1) await sleep(400);
    }

    return events;
  },
};

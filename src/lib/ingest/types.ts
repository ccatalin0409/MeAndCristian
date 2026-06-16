// Tipuri pentru sistemul de ingestie (scrapere + feed-uri).
// Fiecare adaptor de sursă produce RawEvent[]; normalizarea le mapează pe tabelul `events`.

export interface RawEvent {
  source: string; // cheia adaptorului (ex: "iabilet")
  externalId: string; // id stabil din sursă (pentru deduplicare)
  title: string;
  description: string | null;
  ticketUrl: string | null; // link extern (bilete)
  startsAt: string; // ISO 8601
  endsAt: string | null;
  imageUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  isFree: boolean;
  venueName: string | null;
  venueAddress: string | null;
  citySlug: string; // ex: "bucuresti"
  categorySlug: string | null;
}

// Un adaptor de sursă: știe să producă evenimente brute.
export interface SourceAdapter {
  key: string; // identificator unic (ex: "iabilet")
  label: string; // nume afișat (ex: "iaBilet")
  type: "scraper" | "feed" | "manual" | "partner" | "user_submitted";
  url?: string; // URL principal al sursei
  fetchEvents(options?: { maxPages?: number }): Promise<RawEvent[]>;
}

export interface IngestStats {
  source: string;
  fetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
}

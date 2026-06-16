// Tipuri de bază pentru „Ce fac în oraș" — corespund tabelelor din Supabase (secțiunea 4).

export type EventStatus = "draft" | "published" | "hidden";

export type SourceType =
  | "manual"
  | "scraper"
  | "feed"
  | "user_submitted"
  | "partner";

export interface City {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  timezone: string;
}

export interface Venue {
  id: string;
  city_id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  website: string | null;
  is_partner: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Source {
  id: string;
  name: string;
  type: SourceType;
  url: string | null;
  last_synced_at: string | null;
}

export interface EventRow {
  id: string;
  city_id: string;
  venue_id: string | null;
  title: string;
  description: string | null;
  category_id: string | null;
  starts_at: string; // ISO timestamp
  ends_at: string | null;
  is_free: boolean;
  price_min: number | null;
  price_max: number | null;
  is_family_friendly: boolean;
  image_url: string | null;
  ticket_url: string | null;
  source_id: string | null;
  external_id: string | null;
  status: EventStatus;
  is_promoted: boolean;
  created_at: string;
  updated_at: string;
}

// Eveniment „îmbogățit" cu relațiile rezolvate (loc + categorie), folosit în UI.
export interface EventWithRelations extends EventRow {
  venue: Venue | null;
  category: Category | null;
}

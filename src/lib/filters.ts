// Logica filtrelor rapide (Diseară / Mâine / Weekend / Gratis / Lângă mine + categorie).
// Rulează pe client, peste lista de evenimente deja încărcată.

import type { EventWithRelations } from "@/types";

export type QuickFilter = "tonight" | "tomorrow" | "weekend";

export interface ActiveFilters {
  quick: QuickFilter | null;
  free: boolean;
  nearMe: boolean;
  categorySlug: string | null;
  // Interval personalizat ales de utilizator, ca "YYYY-MM-DD" (sau null).
  // Oricare capăt poate lipsi (interval deschis la stânga/dreapta).
  dateFrom: string | null;
  dateTo: string | null;
  // Preț maxim (lei). null = fără limită.
  maxPrice: number | null;
  // Căutare liberă după titlu, descriere, locație.
  search: string;
}

export const EMPTY_FILTERS: ActiveFilters = {
  quick: null,
  free: false,
  nearMe: false,
  categorySlug: null,
  dateFrom: null,
  dateTo: null,
  maxPrice: null,
  search: "",
};

// Prețul de intrare (cel mai mic preț la care poți intra), în lei.
// null = necunoscut („la fața locului"), deci nu îl includem la filtrul de buget.
function entryPrice(e: EventWithRelations): number | null {
  if (e.is_free) return 0;
  if (e.price_min != null) return e.price_min;
  if (e.price_max != null) return e.price_max;
  return null;
}

// Transformă un "YYYY-MM-DD" în Date la 00:00 ora locală (nu UTC),
// ca să nu apară decalaje de fus orar.
function localDateStart(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Intervalul [from, to) pentru un filtru rapid.
function quickRange(quick: QuickFilter): { from: Date; to: Date } {
  const today = startOfDay(new Date());

  if (quick === "tonight") {
    // „Diseară" = tot ce e azi. Folosim începutul zilei (nu „acum"), fiindcă
    // multe surse dau doar data (fără oră exactă, presupusă seara) — altfel
    // evenimentele de azi ar „dispărea" după ora presupusă. Feed-ul taie oricum
    // evenimentele deja trecute de câteva ore.
    const to = new Date(today);
    to.setDate(to.getDate() + 1);
    return { from: today, to };
  }

  if (quick === "tomorrow") {
    const from = new Date(today);
    from.setDate(from.getDate() + 1);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    return { from, to };
  }

  // weekend = următoarea sâmbătă 00:00 până luni 00:00
  const day = today.getDay(); // 0=dum ... 6=sâm
  const daysToSat = (6 - day + 7) % 7;
  const from = new Date(today);
  from.setDate(from.getDate() + daysToSat);
  const to = new Date(from);
  to.setDate(to.getDate() + 2);
  return { from, to };
}

// Distanță aproximativă în km între două puncte (formula haversine).
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface UserLocation {
  lat: number;
  lng: number;
}

export function applyFilters(
  events: EventWithRelations[],
  filters: ActiveFilters,
  location: UserLocation | null
): EventWithRelations[] {
  let result = [...events];

  if (filters.quick) {
    const { from, to } = quickRange(filters.quick);
    result = result.filter((e) => {
      const t = new Date(e.starts_at).getTime();
      return t >= from.getTime() && t < to.getTime();
    });
  }

  // Interval personalizat (de la / până la). Capătul "to" e inclusiv:
  // includem toată ziua selectată, deci comparăm cu începutul zilei următoare.
  if (filters.dateFrom || filters.dateTo) {
    const from = filters.dateFrom ? localDateStart(filters.dateFrom) : null;
    let to: Date | null = null;
    if (filters.dateTo) {
      to = localDateStart(filters.dateTo);
      to.setDate(to.getDate() + 1);
    }
    result = result.filter((e) => {
      const t = new Date(e.starts_at).getTime();
      if (from && t < from.getTime()) return false;
      if (to && t >= to.getTime()) return false;
      return true;
    });
  }

  if (filters.free) {
    result = result.filter((e) => e.is_free);
  }

  if (filters.maxPrice != null) {
    result = result.filter((e) => {
      const p = entryPrice(e);
      return p != null && p <= filters.maxPrice!;
    });
  }

  if (filters.categorySlug) {
    result = result.filter(
      (e) => e.category?.slug === filters.categorySlug
    );
  }

  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    result = result.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.venue?.name?.toLowerCase().includes(q)
    );
  }

  if (filters.nearMe && location) {
    result = result
      .map((e) => ({
        e,
        dist:
          e.venue?.lat != null && e.venue?.lng != null
            ? distanceKm(location.lat, location.lng, e.venue.lat, e.venue.lng)
            : Number.POSITIVE_INFINITY,
      }))
      .sort((a, b) => a.dist - b.dist)
      .map((x) => x.e);
  }

  return result;
}

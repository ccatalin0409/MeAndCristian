"use client";

import dynamic from "next/dynamic";
import type { Category, EventWithRelations } from "@/types";
import { useEventFilters } from "@/lib/useEventFilters";
import FilterChips from "@/components/FilterChips";

// Harta folosește Leaflet (doar pe client) — fără SSR, exact ca în feed.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-[65vh] rounded-2xl bg-surface border border-border grid place-items-center text-muted">
      Se încarcă harta…
    </div>
  ),
});

interface Props {
  events: EventWithRelations[];
  categories: Category[];
}

export default function MapClient({ events, categories }: Props) {
  const { filters, setFilters, location, locating, filtered } =
    useEventFilters(events);

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          placeholder="Caută eveniment, loc..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="w-full rounded-xl border border-border bg-surface text-foreground pl-9 pr-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => setFilters({ ...filters, search: "" })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
          >
            ✕
          </button>
        )}
      </div>

      <FilterChips
        filters={filters}
        categories={categories}
        locating={locating}
        onChange={setFilters}
      />

      <p className="text-sm text-muted">
        {filtered.length} {filtered.length === 1 ? "eveniment" : "evenimente"} pe
        hartă
      </p>

      <MapView events={filtered} userLocation={location} heightClass="h-[65vh]" />
    </div>
  );
}

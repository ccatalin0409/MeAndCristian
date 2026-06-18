"use client";

import dynamic from "next/dynamic";
import type { Category, EventWithRelations } from "@/types";
import { useEventFilters } from "@/lib/useEventFilters";
import EventFilters from "@/components/EventFilters";

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
    <div className="flex flex-col gap-4">
      <EventFilters
        filters={filters}
        onChange={setFilters}
        categories={categories}
        events={events}
        location={location}
        locating={locating}
      />

      <p className="text-sm text-muted">
        {filtered.length} {filtered.length === 1 ? "eveniment" : "evenimente"} pe
        hartă
      </p>

      <MapView events={filtered} userLocation={location} heightClass="h-[65vh]" />
    </div>
  );
}

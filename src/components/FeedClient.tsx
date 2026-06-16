"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Category, EventWithRelations } from "@/types";
import {
  EMPTY_FILTERS,
  applyFilters,
  type ActiveFilters,
  type UserLocation,
} from "@/lib/filters";
import EventCard from "@/components/EventCard";
import FilterChips from "@/components/FilterChips";

// Harta folosește Leaflet (doar pe client) — fără SSR.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-[60vh] rounded-2xl bg-surface border border-border grid place-items-center text-muted">
      Se încarcă harta…
    </div>
  ),
});

interface Props {
  events: EventWithRelations[];
  categories: Category[];
}

export default function FeedClient({ events, categories }: Props) {
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");

  // Cere geolocația când userul activează „Lângă mine".
  useEffect(() => {
    if (!filters.nearMe || location || !("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setFilters((f) => ({ ...f, nearMe: false }));
        alert("Nu am putut accesa locația. Verifică permisiunile.");
      }
    );
  }, [filters.nearMe, location]);

  const filtered = useMemo(
    () => applyFilters(events, filters, location),
    [events, filters, location]
  );

  return (
    <div className="space-y-3">
      <FilterChips
        filters={filters}
        categories={categories}
        locating={locating}
        onChange={setFilters}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {filtered.length}{" "}
          {filtered.length === 1 ? "eveniment" : "evenimente"}
        </p>
        <div className="flex rounded-full border border-border bg-surface p-0.5 text-sm">
          <button
            onClick={() => setView("list")}
            className={`px-3 py-1 rounded-full ${
              view === "list" ? "bg-primary text-primary-foreground" : "text-muted"
            }`}
          >
            Listă
          </button>
          <button
            onClick={() => setView("map")}
            className={`px-3 py-1 rounded-full ${
              view === "map" ? "bg-primary text-primary-foreground" : "text-muted"
            }`}
          >
            Hartă
          </button>
        </div>
      </div>

      {view === "map" ? (
        <MapView events={filtered} userLocation={location} />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 px-6">
      <div className="text-5xl mb-3">🌃</div>
      <p className="font-medium">Nimic pe filtrul ăsta</p>
      <p className="text-sm text-muted mt-1">
        Încearcă „Weekend" sau scoate filtrele ca să vezi tot ce e în oraș.
      </p>
    </div>
  );
}

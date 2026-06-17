"use client";

import { useState } from "react";
import type { Category, EventWithRelations } from "@/types";
import { useEventFilters } from "@/lib/useEventFilters";
import EventCard from "@/components/EventCard";
import EventRow from "@/components/EventRow";
import FilterChips from "@/components/FilterChips";

interface Props {
  events: EventWithRelations[];
  categories: Category[];
}

export default function FeedClient({ events, categories }: Props) {
  const { filters, setFilters, locating, filtered } = useEventFilters(events);
  const [view, setView] = useState<"grid" | "list">("grid");

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

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {filtered.length}{" "}
          {filtered.length === 1 ? "eveniment" : "evenimente"}
        </p>
        <div className="flex rounded-full border border-border bg-surface p-0.5 text-sm">
          <button
            onClick={() => setView("grid")}
            className={`px-3 py-1 rounded-full ${
              view === "grid" ? "bg-primary text-primary-foreground" : "text-muted"
            }`}
          >
            Grilă
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-3 py-1 rounded-full ${
              view === "list" ? "bg-primary text-primary-foreground" : "text-muted"
            }`}
          >
            Listă
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : view === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <EventRow key={e.id} event={e} />
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

"use client";

import Link from "next/link";
import type { EventWithRelations } from "@/types";
import { useSavedEvents } from "@/lib/useSavedEvents";
import EventCard from "@/components/EventCard";

export default function SavedClient({
  events,
}: {
  events: EventWithRelations[];
}) {
  const { ids, ready } = useSavedEvents();

  if (!ready) {
    return <p className="text-sm text-muted py-10 text-center">Se încarcă…</p>;
  }

  const saved = events.filter((e) => ids.has(e.id));

  if (saved.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <div className="text-5xl mb-3">💜</div>
        <p className="font-medium">Niciun eveniment salvat</p>
        <p className="text-sm text-muted mt-1">
          Apasă inima la un eveniment ca să-l găsești aici.
        </p>
        <Link
          href="/"
          className="inline-block mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
        >
          Vezi evenimente
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {saved.map((e) => (
        <EventCard key={e.id} event={e} />
      ))}
    </div>
  );
}

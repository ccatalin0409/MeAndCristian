import type { Metadata } from "next";
import MapClient from "@/components/MapClient";
import { getPublishedEvents } from "@/lib/events";
import { getCategories } from "@/lib/reference";

export const metadata: Metadata = {
  title: "Hartă — Ce fac în oraș",
};

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const [events, categories] = await Promise.all([
    getPublishedEvents(),
    getCategories(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display font-bold tracking-tight text-3xl">Hartă</h1>
        <p className="text-sm text-muted mt-1">
          Evenimentele din București pe hartă
        </p>
      </header>

      <MapClient events={events} categories={categories} />
    </div>
  );
}

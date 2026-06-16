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
    <main className="px-4 pt-4">
      <header className="mb-3">
        <h1 className="text-2xl font-bold tracking-tight">Hartă</h1>
        <p className="text-sm text-muted">Evenimentele din București pe hartă</p>
      </header>

      <MapClient events={events} categories={categories} />
    </main>
  );
}

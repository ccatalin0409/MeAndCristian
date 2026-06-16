import SavedClient from "@/components/SavedClient";
import { getPublishedEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const events = await getPublishedEvents();

  return (
    <main className="px-4 pt-4">
      <header className="mb-3">
        <h1 className="text-2xl font-bold tracking-tight">Salvate</h1>
        <p className="text-sm text-muted">Evenimentele tale salvate</p>
      </header>
      <SavedClient events={events} />
    </main>
  );
}

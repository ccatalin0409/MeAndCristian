import FeedClient from "@/components/FeedClient";
import { getPublishedEvents } from "@/lib/events";
import { getCategories } from "@/lib/reference";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [events, categories] = await Promise.all([
    getPublishedEvents(),
    getCategories(),
  ]);

  return (
    <main className="px-4 pt-4">
      <header className="mb-3">
        <h1 className="text-2xl font-bold tracking-tight">Ce fac în oraș</h1>
        <p className="text-sm text-muted">București · ce se întâmplă acum</p>
      </header>

      {!isSupabaseConfigured() && (
        <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2">
          Mod demo — date de test. Configurează Supabase în <code>.env.local</code>{" "}
          pentru date reale.
        </div>
      )}

      <FeedClient events={events} categories={categories} />
    </main>
  );
}

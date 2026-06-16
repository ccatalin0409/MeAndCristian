// Strat de acces la date pentru evenimente.
// Dacă Supabase e configurat, citește din DB; altfel folosește datele demo (seed).

import type { EventWithRelations } from "@/types";
import { getSeedEvents } from "@/lib/data/seed";
import { createClient } from "@/lib/supabase/server";

const SELECT_WITH_RELATIONS =
  "*, venue:venues(*), category:categories(*)";

// Toate evenimentele publicate, sortate pe starts_at (cele viitoare primele).
export async function getPublishedEvents(): Promise<EventWithRelations[]> {
  const supabase = await createClient();

  if (!supabase) {
    // Mod demo: doar evenimentele care nu s-au terminat deja.
    const now = Date.now();
    return getSeedEvents().filter(
      (e) => new Date(e.starts_at).getTime() >= now - 6 * 60 * 60 * 1000
    );
  }

  const nowIso = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("events")
    .select(SELECT_WITH_RELATIONS)
    .eq("status", "published")
    .gte("starts_at", nowIso)
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("getPublishedEvents:", error.message);
    return [];
  }
  return (data ?? []) as unknown as EventWithRelations[];
}

// Un singur eveniment după id (orice status — folosit și de admin / detaliu).
export async function getEventById(
  id: string
): Promise<EventWithRelations | null> {
  const supabase = await createClient();

  if (!supabase) {
    return getSeedEvents().find((e) => e.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from("events")
    .select(SELECT_WITH_RELATIONS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getEventById:", error.message);
    return null;
  }
  return (data as unknown as EventWithRelations) ?? null;
}

// Toate evenimentele (orice status) pentru panoul de admin.
export async function getAllEventsForAdmin(): Promise<EventWithRelations[]> {
  const supabase = await createClient();

  if (!supabase) {
    return getSeedEvents();
  }

  const { data, error } = await supabase
    .from("events")
    .select(SELECT_WITH_RELATIONS)
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("getAllEventsForAdmin:", error.message);
    return [];
  }
  return (data ?? []) as unknown as EventWithRelations[];
}

// Date de referință: categorii, localuri, surse (Supabase sau demo).

import type { Category, City, Source, Venue } from "@/types";
import { CATEGORIES, CITIES, VENUES } from "@/lib/data/seed";
import { createClient } from "@/lib/supabase/server";

export async function getCities(): Promise<City[]> {
  const supabase = await createClient();
  if (!supabase) return CITIES;

  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .order("name");
  if (error) {
    console.error("getCities:", error.message);
    return [];
  }
  return (data ?? []) as City[];
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  if (!supabase) return CATEGORIES;

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) {
    console.error("getCategories:", error.message);
    return [];
  }
  return (data ?? []) as Category[];
}

export async function getVenues(): Promise<Venue[]> {
  const supabase = await createClient();
  if (!supabase) return VENUES;

  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .order("name");
  if (error) {
    console.error("getVenues:", error.message);
    return [];
  }
  return (data ?? []) as Venue[];
}

export async function getSources(): Promise<Source[]> {
  const supabase = await createClient();
  if (!supabase) {
    return [
      {
        id: "manual",
        name: "Manual (admin)",
        type: "manual",
        url: null,
        last_synced_at: null,
      },
    ];
  }

  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .order("name");
  if (error) {
    console.error("getSources:", error.message);
    return [];
  }
  return (data ?? []) as Source[];
}

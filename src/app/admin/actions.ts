"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminStatus } from "@/lib/admin";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

function num(v: FormDataEntryValue | null): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function str(v: FormDataEntryValue | null): string | null {
  const s = (v as string)?.trim();
  return s ? s : null;
}

// Creează sau actualizează un eveniment (id gol = creare).
export async function saveEvent(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const status = await getAdminStatus();
  if (!status.configured)
    return { ok: false, error: "Supabase nu e configurat." };
  if (!status.isAdmin) return { ok: false, error: "Nu ai drepturi de admin." };

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase indisponibil." };

  const id = str(formData.get("id"));
  const isFree = formData.get("is_free") === "on";

  const startsRaw = str(formData.get("starts_at"));
  if (!startsRaw) return { ok: false, error: "Data de început e obligatorie." };
  const endsRaw = str(formData.get("ends_at"));

  const row = {
    title: str(formData.get("title")) ?? "",
    description: str(formData.get("description")),
    category_id: str(formData.get("category_id")),
    venue_id: str(formData.get("venue_id")),
    city_id: str(formData.get("city_id")),
    starts_at: new Date(startsRaw).toISOString(),
    ends_at: endsRaw ? new Date(endsRaw).toISOString() : null,
    is_free: isFree,
    price_min: isFree ? 0 : num(formData.get("price_min")),
    price_max: isFree ? 0 : num(formData.get("price_max")),
    is_family_friendly: formData.get("is_family_friendly") === "on",
    image_url: str(formData.get("image_url")),
    ticket_url: str(formData.get("ticket_url")),
    is_promoted: formData.get("is_promoted") === "on",
    status: (str(formData.get("status")) ?? "draft") as
      | "draft"
      | "published"
      | "hidden",
  };

  if (!row.title) return { ok: false, error: "Titlul e obligatoriu." };

  if (id) {
    const { error } = await supabase.from("events").update(row).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("events").insert(row);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

export async function deleteEvent(formData: FormData): Promise<void> {
  const status = await getAdminStatus();
  if (!status.isAdmin) return;

  const supabase = await createClient();
  if (!supabase) return;

  const id = str(formData.get("id"));
  if (!id) return;

  await supabase.from("events").delete().eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/");
}

// Adaugă o sursă nouă (pentru management surse).
export async function addSource(formData: FormData): Promise<void> {
  const status = await getAdminStatus();
  if (!status.isAdmin) return;

  const supabase = await createClient();
  if (!supabase) return;

  const name = str(formData.get("name"));
  const type = str(formData.get("type")) ?? "manual";
  const url = str(formData.get("url"));
  if (!name) return;

  await supabase.from("sources").insert({ name, type, url });
  revalidatePath("/admin");
}

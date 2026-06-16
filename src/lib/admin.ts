// Verificarea drepturilor de admin (server-side).
// Un user e admin dacă emailul lui e în env ADMIN_EMAILS sau în tabelul `admins`.

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface AdminStatus {
  configured: boolean; // Supabase setat?
  email: string | null; // emailul userului logat
  isAdmin: boolean;
}

function envAdmins(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAdminStatus(): Promise<AdminStatus> {
  if (!isSupabaseConfigured()) {
    return { configured: false, email: null, isAdmin: false };
  }

  const supabase = await createClient();
  if (!supabase) return { configured: false, email: null, isAdmin: false };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { configured: true, email: null, isAdmin: false };

  const email = (user.email ?? "").toLowerCase();

  // 1) Verificare rapidă prin env
  if (envAdmins().includes(email)) {
    return { configured: true, email, isAdmin: true };
  }

  // 2) Verificare prin funcția is_admin() din DB (tabelul admins)
  const { data, error } = await supabase.rpc("is_admin");
  const isAdmin = !error && data === true;

  return { configured: true, email, isAdmin };
}

// Client Supabase pentru server (Server Components, Route Handlers, Server Actions).
// Returnează null în mod demo (fără env vars).

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "./config";

export async function createClient() {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Apelat dintr-un Server Component fără răspuns mutabil — se ignoră.
          // Reîmprospătarea sesiunii e gestionată de middleware.
        }
      },
    },
  });
}

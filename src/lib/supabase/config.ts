// Verifică dacă Supabase e configurat prin variabile de mediu.
// Dacă nu, aplicația rulează în „mod demo" cu datele din src/lib/data/seed.ts.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// Helper server pentru Web Push (VAPID) + client Supabase cu service_role.
// Rutele /api/push/* sunt singurele care ating tabelele push_*.

import webpush from "web-push";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let configured = false;

// Configurează VAPID o singură dată (lazy — la primul apel).
export function ensureVapid(): boolean {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

// Client Supabase cu service_role (ocolește RLS) — doar pe server.
export function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export interface SubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Trimite o notificare către un abonament. Întoarce true dacă a reușit.
// La 404/410 (abonament expirat) îl șterge din DB.
export async function sendToSubscription(
  db: SupabaseClient,
  sub: SubscriptionRow,
  payload: PushPayload
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      await db.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    }
    return false;
  }
}

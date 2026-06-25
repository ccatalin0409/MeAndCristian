// Trimite notificări push. Protejată cu CRON_SECRET (ca /api/ingest).
// Apelată orar de cron:
//   - remindere personalizate: evenimente salvate care încep în următoarele ~90 min
//   - digest general: o dată pe zi (ora 17 București) — „X evenimente diseară"
//
// Apel manual de test: GET /api/push/send?secret=...

import { NextResponse } from "next/server";
import {
  ensureVapid,
  getServiceClient,
  sendToSubscription,
  type SubscriptionRow,
} from "@/lib/push/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const REMINDER_WINDOW_MS = 90 * 60 * 1000; // 90 min
const DIGEST_HOUR = 17; // ora București la care trimitem digestul „diseară"

function bucharestHour(d: Date): number {
  return Number(
    new Intl.DateTimeFormat("ro-RO", {
      hour: "numeric",
      hour12: false,
      timeZone: "Europe/Bucharest",
    }).format(d)
  );
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const provided =
    url.searchParams.get("secret") ??
    request.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  if (!ensureVapid()) {
    return NextResponse.json({ error: "VAPID neconfigurat" }, { status: 500 });
  }
  const db = getServiceClient();
  if (!db) {
    return NextResponse.json({ error: "Supabase neconfigurat" }, { status: 500 });
  }

  const now = new Date();
  const reminders = await sendReminders(db, now);

  // Digestul general doar o dată pe zi (la ora țintă) sau forțat cu ?digest=1.
  const forceDigest = url.searchParams.get("digest") === "1";
  const general =
    forceDigest || bucharestHour(now) === DIGEST_HOUR
      ? await sendGeneralDigest(db, now)
      : { skipped: true as const };

  return NextResponse.json({ ok: true, reminders, general });
}

// ---- Remindere personalizate ----
async function sendReminders(
  db: ReturnType<typeof getServiceClient>,
  now: Date
) {
  if (!db) return { sent: 0 };
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MS);

  // Evenimentele publicate care încep în fereastra următoare.
  const { data: events } = await db
    .from("events")
    .select("id, title, starts_at")
    .eq("status", "published")
    .gte("starts_at", now.toISOString())
    .lte("starts_at", windowEnd.toISOString());

  if (!events?.length) return { sent: 0 };

  let sent = 0;
  for (const ev of events) {
    // Abonamentele care au salvat acest eveniment și vor remindere.
    const { data: subs } = await db
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("wants_reminders", true)
      .contains("saved_event_ids", [ev.id]);

    if (!subs?.length) continue;

    for (const sub of subs as SubscriptionRow[]) {
      // Dedup: am trimis deja reminderul pentru (endpoint, eveniment)?
      const { data: already } = await db
        .from("push_sent")
        .select("endpoint")
        .eq("endpoint", sub.endpoint)
        .eq("event_id", ev.id)
        .eq("kind", "reminder")
        .maybeSingle();
      if (already) continue;

      const time = new Intl.DateTimeFormat("ro-RO", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Bucharest",
      }).format(new Date(ev.starts_at));

      const ok = await sendToSubscription(db, sub, {
        title: "Începe curând 🔔",
        body: `${ev.title} · ${time}`,
        url: `/event/${ev.id}`,
        tag: `reminder-${ev.id}`,
      });
      if (ok) {
        sent++;
        await db
          .from("push_sent")
          .insert({ endpoint: sub.endpoint, event_id: ev.id, kind: "reminder" });
      }
    }
  }
  return { sent };
}

// ---- Digest general „diseară" ----
async function sendGeneralDigest(
  db: ReturnType<typeof getServiceClient>,
  now: Date
) {
  if (!db) return { sent: 0, count: 0 };

  // Câte evenimente mai încep până la miezul nopții (ora București).
  const hoursLeft = 24 - bucharestHour(now);
  const end = new Date(now.getTime() + hoursLeft * 60 * 60 * 1000);

  const { count } = await db
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .gte("starts_at", now.toISOString())
    .lte("starts_at", end.toISOString());

  const n = count ?? 0;
  if (n === 0) return { sent: 0, count: 0 };

  const { data: subs } = await db
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("wants_general", true);

  if (!subs?.length) return { sent: 0, count: n };

  let sent = 0;
  for (const sub of subs as SubscriptionRow[]) {
    const ok = await sendToSubscription(db, sub, {
      title: "Ce fac în oraș 🌃",
      body: `Diseară sunt ${n} ${n === 1 ? "eveniment" : "evenimente"} în București`,
      url: "/",
      tag: "digest",
    });
    if (ok) sent++;
  }
  return { sent, count: n };
}

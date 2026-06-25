// Înregistrează / actualizează un abonament push (anonim, keyed pe endpoint).
// Body: { subscription, savedEventIds?, wantsGeneral?, wantsReminders? }

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/push/server";

export const dynamic = "force-dynamic";

interface Body {
  subscription?: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  savedEventIds?: string[];
  wantsGeneral?: boolean;
  wantsReminders?: boolean;
}

export async function POST(request: Request) {
  const db = getServiceClient();
  if (!db) {
    return NextResponse.json({ error: "Supabase neconfigurat" }, { status: 500 });
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  const sub = body.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: "Abonament invalid" }, { status: 400 });
  }

  const row = {
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
    saved_event_ids: Array.isArray(body.savedEventIds) ? body.savedEventIds : [],
    wants_general: body.wantsGeneral ?? true,
    wants_reminders: body.wantsReminders ?? true,
    user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await db
    .from("push_subscriptions")
    .upsert(row, { onConflict: "endpoint" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

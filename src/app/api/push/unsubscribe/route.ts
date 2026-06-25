// Șterge un abonament push. Body: { endpoint }

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/push/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const db = getServiceClient();
  if (!db) {
    return NextResponse.json({ error: "Supabase neconfigurat" }, { status: 500 });
  }

  let endpoint: string | undefined;
  try {
    endpoint = (await request.json())?.endpoint;
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }
  if (!endpoint) {
    return NextResponse.json({ error: "Lipsește endpoint" }, { status: 400 });
  }

  const { error } = await db
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

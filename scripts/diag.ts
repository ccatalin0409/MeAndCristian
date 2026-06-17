import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { looksFree, parsePriceFromText } from "../src/lib/ingest/pricing";

config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Orice mențiune „gratis/liber/free" (foarte permisiv) ca să vedem ce ratăm.
const FREE_HINT = /\b(gratu\w*|gratis|liber[ăa]?|free|f[ăa]r[ăa] (bilet|tax|cost))\b/i;

async function main() {
  const { data, error } = await sb
    .from("events")
    .select("title, description, is_free, price_min, price_max");
  if (error) {
    console.log("ERR", error.message);
    process.exit(1);
  }
  const rows = (data ?? []) as any[];

  // Evenimente „necunoscute" (nu gratis, fără preț) dar care au indicii de gratuit.
  const unknown = rows.filter(
    (e) => !e.is_free && e.price_min == null && e.price_max == null
  );
  const missed = unknown.filter((e) => {
    const text = `${e.title}\n${e.description ?? ""}`;
    return FREE_HINT.test(text) && !parsePriceFromText(text);
  });

  console.log(
    `Necunoscute: ${unknown.length} | cu indiciu de gratuit dar NEdetectate: ${missed.length}\n`
  );
  for (const e of missed) {
    const text = `${e.title}\n${e.description ?? ""}`;
    const m = text.match(FREE_HINT);
    const i = m ? text.toLowerCase().indexOf(m[0].toLowerCase()) : 0;
    const ctx = text.slice(Math.max(0, i - 35), i + 35).replace(/\s+/g, " ");
    console.log(`• "${e.title.slice(0, 45)}"\n    …${ctx}… (looksFree=${looksFree(text)})`);
  }
}

main();

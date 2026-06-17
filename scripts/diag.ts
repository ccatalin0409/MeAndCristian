import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function norm(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function tokens(s: string): Set<string> {
  return new Set(norm(s).split(" ").filter((w) => w.length > 2));
}
function jaccard(a: Set<string>, b: Set<string>): number {
  const inter = [...a].filter((x) => b.has(x)).length;
  const uni = new Set([...a, ...b]).size;
  return uni ? inter / uni : 0;
}

async function main() {
  const { data, error } = await sb
    .from("events")
    .select(
      "id, title, starts_at, is_free, price_min, price_max, description, external_id, source:sources(name)"
    );
  if (error) {
    console.log("ERR", error.message);
    process.exit(1);
  }
  const rows = (data ?? []) as any[];
  console.log("Total:", rows.length);

  // === A. Toate cele marcate GRATIS — vedem daca sunt corecte ===
  console.log("\n=== GRATIS (toate) ===");
  for (const e of rows.filter((x) => x.is_free)) {
    const d = (e.description || "").replace(/\s+/g, " ").slice(0, 120);
    console.log(
      `• [${e.source?.name}] "${e.title.slice(0, 55)}"\n    pmin=${e.price_min} pmax=${e.price_max} | desc: ${d}`
    );
  }

  // === B. Near-duplicate: aceeasi zi + similaritate titlu > 0.55 ===
  console.log("\n=== NEAR-DUPLICATE (acelasi day, titluri similare) ===");
  const seen = new Set<number>();
  let pairs = 0;
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i],
        b = rows[j];
      if ((a.starts_at || "").slice(0, 10) !== (b.starts_at || "").slice(0, 10))
        continue;
      const sim = jaccard(tokens(a.title), tokens(b.title));
      if (sim >= 0.55 && norm(a.title) !== norm(b.title)) {
        pairs++;
        if (pairs <= 15)
          console.log(
            `  sim=${sim.toFixed(2)} [${a.source?.name}] "${a.title.slice(0, 40)}"  ⇄  [${b.source?.name}] "${b.title.slice(0, 40)}"`
          );
      }
    }
  }
  console.log(`  Total perechi near-dup (titlu diferit): ${pairs}`);
}

main();

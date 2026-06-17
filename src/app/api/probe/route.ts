// RUTĂ TEMPORARĂ DE RECON — read-only, NU scrie nimic în DB.
// Testează din rețeaua Vercel ce surse sunt accesibile și care au JSON-LD/feed.
// Protejată cu CRON_SECRET. Se șterge după ce strângem datele.
//
//   GET /api/probe?secret=...

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// Pagini candidate (de listare evenimente, nu homepage acolo unde se poate).
const URLS: string[] = [
  // ticketing / agregatoare
  "https://www.bilete.ro/",
  "https://www.entertix.ro/",
  "https://www.eventim.ro/",
  "https://www.metropotam.ro/",
  // teatre / săli
  "https://teatrelli.ro/",
  "https://teatrelli.ro/program/",
  "https://www.godotcafe.ro/",
  "https://www.godotcafe.ro/program",
  "https://bilete.tnb.ro/",
  "https://operanb.ro/spectacole/",
  "https://www.teatrul-odeon.ro/",
  "https://www.teatrulmic.ro/",
  "https://www.sala-radio.ro/",
  // cluburi
  "https://quanticclub.ro/",
  "https://quanticclub.ro/evenimente/",
  "https://control-club.ro/",
  "https://control-club.ro/evenimente/",
  "https://expirat.org/",
  "https://expirat.org/evenimente/",
  "https://berariah.ro/evenimente/",
  "https://fratelli.ro/",
];

function countJsonLdEvents(html: string): number {
  const re = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(html))) {
    const ev = m[1].match(/"@type"\s*:\s*"Event"/g);
    if (ev) n += ev.length;
  }
  return n;
}

function detectFeed(html: string): string | null {
  const rss = html.match(
    /<link[^>]+type=["']application\/(rss|atom)\+xml["'][^>]*href=["']([^"']+)["']/i
  );
  if (rss) return rss[2];
  if (/\/wp-json\/tribe\/events/i.test(html)) return "tribe-api";
  return null;
}

async function probe(url: string) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html", "Accept-Language": "ro,en;q=0.8" },
      signal: c.signal,
      redirect: "follow",
    });
    const body = await res.text();
    return {
      url,
      status: res.status,
      jsonldEvents: res.status < 400 ? countJsonLdEvents(body) : 0,
      feed: res.status < 400 ? detectFeed(body) : null,
      wordpress: /wp-content|wp-json/.test(body),
      bytes: body.length,
      finalUrl: res.url,
    };
  } catch (e: unknown) {
    const err = e as { name?: string; message?: string; cause?: { code?: string } };
    return { url, status: 0, error: `${err.name}: ${err.cause?.code ?? err.message}` };
  } finally {
    clearTimeout(t);
  }
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = new URL(request.url).searchParams.get("secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  // rulează în paralel, în loturi mici
  const results = [];
  const batchSize = 6;
  for (let i = 0; i < URLS.length; i += batchSize) {
    const batch = URLS.slice(i, i + batchSize);
    results.push(...(await Promise.all(batch.map(probe))));
  }

  // sortare: cele cu JSON-LD primele
  results.sort(
    (a, b) => (b.jsonldEvents ?? 0) - (a.jsonldEvents ?? 0)
  );

  return NextResponse.json({ count: results.length, results });
}

// Helper pentru site-urile pe plugin-ul WordPress „EventOn" (ex. OneEvent).
// Acolo „Intrare liberă" e un TAG structurat (`data-filter='event_type'
// data-v='Intrare liberă'`), nu text în descriere — deci e un semnal de gratis
// mult mai fiabil. Îl citim din pagina de listare și-l legăm de URL-ul fiecărui
// eveniment (ancora microdata `<a itemprop='url' href=...>`, una per card).

// Normalizează un URL pentru comparație stabilă (decodează %xx, lowercase,
// fără slash final).
export function normUrl(u: string | null | undefined): string {
  if (!u) return "";
  let s = u;
  try {
    s = decodeURIComponent(u);
  } catch {
    /* lăsăm forma originală dacă nu se poate decoda */
  }
  return s.trim().toLowerCase().replace(/\/+$/, "");
}

// Întoarce mulțimea URL-urilor (normalizate) marcate „Intrare liberă" în listing.
export function detectEventOnFreeUrls(html: string): Set<string> {
  const anchorRe = /itemprop=['"]url['"]\s+href=['"]([^'"]+)['"]/gi;
  const anchors: { url: string; idx: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = anchorRe.exec(html))) anchors.push({ url: m[1], idx: m.index });

  const free = new Set<string>();
  for (let i = 0; i < anchors.length; i++) {
    const end =
      i + 1 < anchors.length ? anchors[i + 1].idx : anchors[i].idx + 6000;
    const seg = html.slice(anchors[i].idx, end);
    if (/data-v=['"]\s*Intrare liber[ăa]\s*['"]/i.test(seg)) {
      free.add(normUrl(anchors[i].url));
    }
  }
  return free;
}

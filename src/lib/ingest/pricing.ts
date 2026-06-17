// Logica de preț + „gratis", centralizată ca să fie consistentă în toate sursele.
//
// Ordinea de decizie (importantă!):
//   1. Preț explicit din sursă (oferta) → îl folosim.
//   2. Preț găsit în descriere („35 lei", „59.99 RON") → cu preț, NU gratis.
//   3. Text spune „intrare liberă/gratuită" ȘI n-am găsit niciun preț → gratis.
//   4. Nimic → necunoscut (nu inventăm).
//
// Pasul 2 înaintea lui 3 rezolvă „false gratis": dacă în descriere apare un preț,
// evenimentul nu mai e marcat gratuit chiar dacă conține și cuvântul „gratis".

// Preț în text: „35 lei", „de la 50 lei", „59,99 RON". Cere sufixul lei/ron ca
// să nu prindem ani/ore/numere oarecare. Prețuri tipice la bilete: zeci–sute.
const PRICE_TOKEN_RE = /(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:lei|ron)\b/gi;

export function parsePriceFromText(
  text: string
): { min: number; max: number } | null {
  const values: number[] = [];
  for (const m of text.matchAll(PRICE_TOKEN_RE)) {
    const n = Number(m[1].replace(",", "."));
    if (Number.isFinite(n) && n >= 0 && n <= 5000) values.push(n);
  }
  if (!values.length) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}

// „Gratis" doar cu context clar de intrare/acces — NU pe orice „gratis" rătăcit
// în text (ex. „parcare gratuită", „transport gratuit", „primii 10 gratis").
const FREE_RE =
  /\b(intrare[a]?|acces[ul]?|participare[a]?)\b[\s\wșțăîâ.,:–-]{0,18}?\b(liber[ăa]?|gratuit[ăa]?|gratis)\b|\bfree\s+(entry|admission)\b/i;
const NOT_FREE_RE = /\bnu (?:e|este|sunt) (?:gratuit|gratis|liber)|contra cost\b/i;

export function looksFree(text: string): boolean {
  if (NOT_FREE_RE.test(text)) return false;
  return FREE_RE.test(text);
}

export interface ResolvedPricing {
  priceMin: number | null;
  priceMax: number | null;
  isFree: boolean;
}

export function resolvePricing(opts: {
  offerPrice: number | null;
  title: string;
  description: string | null;
}): ResolvedPricing {
  const { offerPrice, title, description } = opts;

  // 1) Preț explicit din sursă.
  if (offerPrice != null) {
    return {
      priceMin: offerPrice,
      priceMax: offerPrice,
      isFree: offerPrice === 0,
    };
  }

  const text = `${title}\n${description ?? ""}`;

  // 2) Preț găsit în descriere → cu preț (deci NU gratis).
  const fromText = parsePriceFromText(text);
  if (fromText) {
    return {
      priceMin: fromText.min,
      priceMax: fromText.max,
      isFree: fromText.min === 0,
    };
  }

  // 3) Text spune liber/gratuit și n-am găsit preț → gratis.
  if (looksFree(text)) {
    return { priceMin: 0, priceMax: 0, isFree: true };
  }

  // 4) Necunoscut.
  return { priceMin: null, priceMax: null, isFree: false };
}

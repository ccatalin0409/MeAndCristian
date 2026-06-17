// Ghicește categoria unui eveniment din titlu + descriere (cuvinte-cheie).
// Sursele de bilete nu dau mereu categoria, așa că o deducem.
//
// Două principii importante:
//  1. TITLUL decide primul (semnal sigur), abia apoi descrierea — altfel un
//     cuvânt din descriere („taraf", „spectacol" la figurat) fură categoria.
//  2. Ordinea regulilor = prioritate. „party" înaintea „concerte" ca „Petrecere"
//     din titlu să bată „live"; „family" cere context explicit („pentru copii"),
//     nu orice „copii" (multe sunt note de vârstă: „accesul copiilor…").

const RULES: { slug: string; keywords: RegExp }[] = [
  { slug: "stand-up", keywords: /stand[\s-]?up|comedy|comedie|\bopen mic\b/i },
  {
    slug: "party",
    keywords:
      /\bparty\b|petrecere|club night|\brave\b|techno|\bhouse\b|boiler|\bquiz\b|trivia|karaoke|after[\s-]?party|k-?pop|hip[\s-]?hop night|reggaeton|\bdj\b/i,
  },
  {
    // Târguri / food / degustări. „t[âa]rg(ul|uri)?" cu \b ca să NU prindem
    // orașul „Târgu Mureș/Jiu".
    slug: "targuri",
    keywords:
      /\bbazar\b|\bt[âa]rg(?:ul|uri)?\b|\bfair\b|\bmarket\b|street food|food (?:festival|truck)|degustare|tasting|\bwine\b|yard sale/i,
  },
  {
    slug: "concerte",
    keywords:
      /concert|recital|symphony|simfonic|turneu|acustic|festival(?!.*film)|taraf|fanfar|jam session|trup[ăa]|cvartet|orchestr|\blive\b|arenele romane|sala palatului|sala radio|sala luceaf|hard rock|quantic|control club|expirat|ber[ăa]ria/i,
  },
  {
    slug: "teatru",
    keywords:
      /teatr|spectacol|\bpiesa\b|one man show|dramatic|operet|\bbalet\b|musical|cenaclu/i,
  },
  { slug: "film", keywords: /\bfilm\b|cinema|proiec[țt]ie|screening|avanpremier/i },
  {
    slug: "expozitii",
    keywords:
      /expozi|vernisaj|muzeu|art safari|galerie|workshop|atelier(?!.*copii)|lansare de carte|conferin[țt]|masterclass/i,
  },
  {
    // Cere context clar de „pentru copii/familie" — NU bare „copii/familie"
    // (care apare des în note de vârstă).
    slug: "family",
    keywords:
      /pentru copii|pentru cei mici|pentru (?:toat[ăa] )?famili|[îi]n familie|spectacol pentru copii|atelier pentru copii|family[\s-]?friendly|\bkids\b|p[aă]pu[șs]|matineu|\bbasm/i,
  },
];

export function guessCategory(
  title: string,
  description: string | null
): string | null {
  // 1) Titlul decide primul.
  for (const rule of RULES) {
    if (rule.keywords.test(title)) return rule.slug;
  }
  // 2) Apoi descrierea.
  if (description) {
    for (const rule of RULES) {
      if (rule.keywords.test(description)) return rule.slug;
    }
  }
  return null;
}

// Notă: detecția „gratis" + parsarea prețului s-au mutat în ./pricing.ts
// (resolvePricing), ca să fie o singură logică pentru toate sursele.

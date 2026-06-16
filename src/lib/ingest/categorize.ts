// Ghicește categoria unui eveniment din titlu + descriere (cuvinte-cheie).
// Sursele de bilete nu dau mereu categoria, așa că o deducem.

const RULES: { slug: string; keywords: RegExp }[] = [
  { slug: "stand-up", keywords: /stand[\s-]?up|comedy|comedie|open mic/i },
  {
    slug: "concerte",
    keywords: /concert|live|recital|symphony|simfonic|turneu|acustic|festival(?!.*film)/i,
  },
  { slug: "teatru", keywords: /teatr|spectacol|piesa|one man show|dramatic/i },
  {
    slug: "expozitii",
    keywords: /expozi|vernisaj|muzeu|art safari|galerie|workshop|atelier(?!.*copii)/i,
  },
  { slug: "targuri", keywords: /t[aâ]rg|bazar|fair|market|expo\b/i },
  {
    slug: "party",
    keywords: /party|petrecere|dj\b|club night|rave|techno|house|boiler/i,
  },
  {
    slug: "family",
    keywords: /copii|familie|family|p[aă]pu[șs]|atelier.*copii|matineu/i,
  },
  { slug: "film", keywords: /film|cinema|proiec[țt]ie|screening/i },
];

export function guessCategory(
  title: string,
  description: string | null
): string | null {
  const text = `${title} ${description ?? ""}`;
  for (const rule of RULES) {
    if (rule.keywords.test(text)) return rule.slug;
  }
  return null;
}

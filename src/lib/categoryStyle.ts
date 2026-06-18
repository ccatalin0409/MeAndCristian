// Stil vizual per categorie — culori oklch din designul „Ce fac diseară".
// Folosit pentru posterele cardurilor, punctele și etichetele colorate.

const HUE: Record<string, number> = {
  concerte: 292,
  party: 332,
  teatru: 45,
  expozitii: 200,
  film: 258,
  family: 152,
  "stand-up": 22,
  targuri: 110,
};

export function catHue(slug?: string | null): number {
  return (slug && HUE[slug]) || 285;
}

// Gradient pentru posterul cardului (când nu există imagine).
export function catGradient(slug?: string | null): string {
  const h = catHue(slug);
  return `radial-gradient(125% 125% at 12% 8%, oklch(0.66 0.16 ${h}) 0%, oklch(0.42 0.15 ${
    h + 18
  }) 52%, oklch(0.25 0.09 ${h + 28}) 100%)`;
}

// Culoare de accent pentru text/puncte (numele categoriei pe card).
export function catColor(slug?: string | null): string {
  return `oklch(0.82 0.11 ${catHue(slug)})`;
}

// Accentul aplicației (violet) — folosit la chip-uri active, butoane.
export const ACCENT_1 = "oklch(0.78 0.15 292)";
export const ACCENT_2 = "oklch(0.6 0.2 292)";

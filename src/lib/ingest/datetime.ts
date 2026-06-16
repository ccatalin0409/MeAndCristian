// Ajutoare pentru date. Sursele dau adesea doar data (fără oră);
// punem o oră implicită rezonabilă (seara) în fusul Europe/Bucharest.

const TZ = "Europe/Bucharest";

// Offsetul (minute față de UTC) al fusului la un anumit instant.
function tzOffsetMinutes(utcMs: number): number {
  const d = new Date(utcMs);
  const local = new Date(d.toLocaleString("en-US", { timeZone: TZ }));
  const utc = new Date(d.toLocaleString("en-US", { timeZone: "UTC" }));
  return Math.round((local.getTime() - utc.getTime()) / 60000);
}

// "YYYY-MM-DD" (+ oră locală) -> ISO UTC corect pentru București.
// Dacă șirul are deja oră (conține "T..:.."), îl folosim direct.
export function toBucharestISO(
  dateOrIso: string,
  defaultHour = 19
): string | null {
  if (!dateOrIso) return null;

  // Are deja oră? lăsăm Date să-l interpreteze (poate avea offset/Z).
  if (/T\d{2}:\d{2}/.test(dateOrIso)) {
    const d = new Date(dateOrIso);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  const m = dateOrIso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) {
    const d = new Date(dateOrIso);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  const [, y, mo, da] = m.map(Number) as unknown as number[];
  const base = Date.UTC(y, mo - 1, da, defaultHour, 0, 0);
  const off = tzOffsetMinutes(base);
  // vrem ca ora locală = defaultHour => utc = base - offset
  return new Date(base - off * 60000).toISOString();
}

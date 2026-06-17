// Ajutoare pentru date. Sursele dau formate variate și uneori ne-standard
// (ex: "2026-6-19T19:30+0:00" — lună/zi fără zero, offset greșit).
//
// Toate sursele noastre sunt din București, așa că interpretăm ora ca fiind
// ORA LOCALĂ București și ignorăm offset-ul din sursă (frecvent greșit în CMS-uri).
// Dacă lipsește ora, punem o oră implicită rezonabilă (seara).

const TZ = "Europe/Bucharest";

// Offsetul (minute față de UTC) al fusului la un anumit instant.
function tzOffsetMinutes(utcMs: number): number {
  const d = new Date(utcMs);
  const local = new Date(d.toLocaleString("en-US", { timeZone: TZ }));
  const utc = new Date(d.toLocaleString("en-US", { timeZone: "UTC" }));
  return Math.round((local.getTime() - utc.getTime()) / 60000);
}

// Construiește instantul UTC pentru o oră locală București dată (Y-M-D H:M).
function bucharestLocalToUtcISO(
  y: number,
  mo: number,
  da: number,
  hh: number,
  mm: number
): string {
  const base = Date.UTC(y, mo - 1, da, hh, mm, 0);
  const off = tzOffsetMinutes(base);
  return new Date(base - off * 60000).toISOString();
}

// Acceptă "YYYY-M-D", "YYYY-MM-DDTHH:MM(:SS)(offset)", etc.
// Returnează ISO UTC sau null dacă nu se poate interpreta.
export function toBucharestISO(
  input: string,
  defaultHour = 19
): string | null {
  if (!input) return null;
  const s = input.trim();

  const m = s.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::\d{2})?)?/
  );

  if (!m) {
    // ultim resort: lasă Date să încerce
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  const y = Number(m[1]);
  const mo = Number(m[2]);
  const da = Number(m[3]);

  // validare de bază
  if (mo < 1 || mo > 12 || da < 1 || da > 31) return null;

  if (m[4] == null) {
    // doar data → oră implicită
    return bucharestLocalToUtcISO(y, mo, da, defaultHour, 0);
  }

  const hh = Number(m[4]);
  const mm = Number(m[5]);
  return bucharestLocalToUtcISO(y, mo, da, hh, mm);
}

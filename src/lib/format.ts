// Formatare în limba română pentru date, ore și prețuri.

import type { EventWithRelations } from "@/types";

const TZ = "Europe/Bucharest";

const dayFmt = new Intl.DateTimeFormat("ro-RO", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: TZ,
});

const timeFmt = new Intl.DateTimeFormat("ro-RO", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

const fullDayFmt = new Intl.DateTimeFormat("ro-RO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: TZ,
});

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// „Azi", „Mâine" sau data scurtă.
export function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  if (sameDay(d, now)) return "Azi";
  if (sameDay(d, tomorrow)) return "Mâine";
  return dayFmt.format(d);
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

export function formatFullDate(iso: string): string {
  return fullDayFmt.format(new Date(iso));
}

// „Azi · 20:00" pentru carduri.
export function formatWhen(iso: string): string {
  return `${formatDayLabel(iso)} · ${formatTime(iso)}`;
}

// „Gratis", „120 lei", „120–250 lei", „Preț pe site" (când nu-l știm).
export function formatPrice(e: EventWithRelations): string {
  if (e.is_free) return "Gratis";
  // Preț necunoscut — nu-l inventăm; trimitem la sursă.
  if (e.price_min == null && e.price_max == null) return "Preț pe site";
  if (e.price_min != null && e.price_max != null && e.price_min !== e.price_max) {
    return `${e.price_min}–${e.price_max} lei`;
  }
  const v = e.price_min ?? e.price_max;
  return v === 0 ? "Gratis" : `${v} lei`;
}

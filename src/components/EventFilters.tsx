"use client";

import { useState } from "react";
import type { Category, EventWithRelations } from "@/types";
import {
  EMPTY_FILTERS,
  applyFilters,
  type ActiveFilters,
  type QuickFilter,
  type UserLocation,
} from "@/lib/filters";

// Filtru unic, folosit și pe Acasă și pe Hartă. Esențialele la vedere
// (căutare + categorii + Diseară/Mâine/Weekend + Gratis + Lângă mine), iar
// restul (interval de date, preț maxim) sub butonul „Filtre" — ca să nu copleșească.

interface Props {
  filters: ActiveFilters;
  onChange: (f: ActiveFilters) => void;
  categories: Category[];
  events: EventWithRelations[];
  location: UserLocation | null;
  locating: boolean;
  showSearch?: boolean;
}

const DATE_PILLS: { label: string; val: QuickFilter }[] = [
  { label: "Diseară", val: "tonight" },
  { label: "Mâine", val: "tomorrow" },
  { label: "Weekend", val: "weekend" },
];

export default function EventFilters({
  filters,
  onChange,
  categories,
  events,
  location,
  locating,
  showSearch = true,
}: Props) {
  const [open, setOpen] = useState(false);

  // Contoarele de pe categorii ignoră filtrul de categorie curent.
  const baseList = applyFilters(
    events,
    { ...filters, categorySlug: null },
    location
  );

  const advancedCount =
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.maxPrice != null ? 1 : 0);

  const set = (patch: Partial<ActiveFilters>) => onChange({ ...filters, ...patch });
  const setQuick = (val: QuickFilter) =>
    set({ quick: filters.quick === val ? null : val });

  return (
    <div className="flex flex-col gap-3">
      {showSearch && (
        <div className="flex items-center gap-2.5 px-3.5 rounded-xl bg-surface border border-border focus-within:border-primary/50">
          <SearchIcon />
          <input
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Caută evenimente, locuri, artiști…"
            className="flex-1 bg-transparent outline-none py-3 text-sm placeholder:text-muted"
          />
          {filters.search && (
            <button onClick={() => set({ search: "" })} className="text-muted hover:text-foreground" aria-label="Șterge">✕</button>
          )}
        </div>
      )}

      {/* Categorii — rând orizontal scrollabil */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        <Chip active={!filters.categorySlug} onClick={() => set({ categorySlug: null })}>
          Toate <Count active={!filters.categorySlug}>{baseList.length}</Count>
        </Chip>
        {categories.map((c) => {
          const active = filters.categorySlug === c.slug;
          const n = baseList.filter((e) => e.category?.slug === c.slug).length;
          return (
            <Chip key={c.slug} active={active} onClick={() => set({ categorySlug: active ? null : c.slug })}>
              {c.name} <Count active={active}>{n}</Count>
            </Chip>
          );
        })}
      </div>

      {/* Rând rapid: dată + gratis + lângă mine + Filtre */}
      <div className="flex items-center gap-2 flex-wrap">
        {DATE_PILLS.map((d) => (
          <Chip key={d.val} active={filters.quick === d.val} onClick={() => setQuick(d.val)}>{d.label}</Chip>
        ))}
        <span className="w-px h-5 bg-border mx-0.5" />
        <Chip active={filters.free} onClick={() => set({ free: !filters.free, maxPrice: null })}>Gratis</Chip>
        <Chip active={filters.nearMe} onClick={() => set({ nearMe: !filters.nearMe })}>
          <PinSmall /> {locating ? "Te caut…" : "Lângă mine"}
        </Chip>
        <button
          onClick={() => setOpen((o) => !o)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13.5px] font-semibold border transition-colors ${
            open || advancedCount
              ? "text-foreground border-primary/40 bg-primary/10"
              : "text-muted border-border bg-surface/60 hover:text-foreground"
          }`}
        >
          <SlidersIcon /> Filtre
          {advancedCount > 0 && (
            <span className="font-mono text-[11px] font-bold text-primary">{advancedCount}</span>
          )}
        </button>
      </div>

      {/* Panou avansat */}
      {open && (
        <div className="rounded-2xl border border-border bg-surface/60 p-4 flex flex-col gap-4">
          <div>
            <Label>INTERVAL</Label>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <input
                type="date"
                value={filters.dateFrom ?? ""}
                onChange={(e) => set({ dateFrom: e.target.value || null })}
                className="rounded-lg border border-border bg-background text-foreground text-sm px-2.5 py-2"
              />
              <span className="text-muted">–</span>
              <input
                type="date"
                value={filters.dateTo ?? ""}
                onChange={(e) => set({ dateTo: e.target.value || null })}
                className="rounded-lg border border-border bg-background text-foreground text-sm px-2.5 py-2"
              />
            </div>
          </div>
          <div>
            <Label>PREȚ MAXIM</Label>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Chip active={filters.maxPrice === 50} onClick={() => set({ maxPrice: filters.maxPrice === 50 ? null : 50, free: false })}>Sub 50 lei</Chip>
              <Chip active={filters.maxPrice === 100} onClick={() => set({ maxPrice: filters.maxPrice === 100 ? null : 100, free: false })}>Sub 100 lei</Chip>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1.5">
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="orice"
                  value={filters.maxPrice ?? ""}
                  onChange={(e) => set({ maxPrice: e.target.value ? Number(e.target.value) : null, free: false })}
                  className="w-16 bg-transparent outline-none text-sm"
                  aria-label="Preț maxim în lei"
                />
                <span className="text-xs text-muted">lei</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onChange({ ...EMPTY_FILTERS, search: filters.search })}
            className="self-start text-[13px] font-semibold text-muted hover:text-foreground"
          >
            Resetează filtrele
          </button>
        </div>
      )}
    </div>
  );
}

/* ---- bucățele ---- */
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13.5px] font-semibold whitespace-nowrap border transition-colors shrink-0 ${
        active ? "text-white border-transparent" : "text-muted border-border bg-surface/60 hover:text-foreground"
      }`}
      style={active ? { background: "linear-gradient(135deg, oklch(0.78 0.15 292), oklch(0.6 0.2 292))" } : undefined}
    >
      {children}
    </button>
  );
}
function Count({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <span className={`font-mono text-[11px] font-bold ${active ? "opacity-85" : "opacity-50"}`}>{children}</span>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[11px] tracking-widest text-muted/70">{children}</span>;
}
function SearchIcon() {
  return <svg className="w-4 h-4 text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>;
}
function PinSmall() {
  return <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z" /><circle cx="12" cy="9" r="2.2" /></svg>;
}
function SlidersIcon() {
  return <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h11M19 8h1M4 16h5M13 16h7" /><circle cx="16" cy="8" r="2.2" /><circle cx="10" cy="16" r="2.2" /></svg>;
}

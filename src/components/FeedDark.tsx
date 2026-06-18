"use client";

import { useState } from "react";
import Link from "next/link";
import type { Category, EventWithRelations } from "@/types";
import {
  EMPTY_FILTERS,
  applyFilters,
  type QuickFilter,
} from "@/lib/filters";
import { useEventFilters } from "@/lib/useEventFilters";
import { useSavedEvents } from "@/lib/useSavedEvents";
import { formatPrice, formatWhen } from "@/lib/format";
import { catColor, catGradient } from "@/lib/categoryStyle";
import EventCardNew from "@/components/EventCardNew";

interface Props {
  events: EventWithRelations[];
  categories: Category[];
}

const DATE_PILLS: { label: string; val: QuickFilter }[] = [
  { label: "Diseară", val: "tonight" },
  { label: "Mâine", val: "tomorrow" },
  { label: "Weekend", val: "weekend" },
];

export default function FeedDark({ events, categories }: Props) {
  const { filters, setFilters, locating, filtered, location } =
    useEventFilters(events);
  const { ids, toggle } = useSavedEvents();
  const [view, setView] = useState<"grid" | "list">("grid");

  // Lista de bază (toate filtrele MAI PUȚIN categoria) — pentru contoarele de pe chip-uri.
  const baseList = applyFilters(
    events,
    { ...filters, categorySlug: null },
    location
  );

  const noNarrowing =
    !filters.quick &&
    !filters.search &&
    !filters.free &&
    filters.maxPrice == null &&
    !filters.categorySlug &&
    !filters.nearMe;

  const featured =
    noNarrowing && filtered.length
      ? events.find((e) => e.is_promoted) ?? filtered[0]
      : null;

  const gridEvents = featured
    ? filtered.filter((e) => e.id !== featured.id)
    : filtered;

  function setQuick(val: QuickFilter) {
    setFilters({ ...filters, quick: filters.quick === val ? null : val });
  }
  function toggleFree() {
    setFilters({ ...filters, free: !filters.free, maxPrice: null });
  }
  function setMax(v: number) {
    setFilters({
      ...filters,
      maxPrice: filters.maxPrice === v ? null : v,
      free: false,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Titlu + live */}
      <div>
        <h1 className="font-display font-bold tracking-tight text-3xl sm:text-4xl leading-none">
          Diseară în oraș
        </h1>
        <div className="flex items-center gap-2 mt-2.5 text-muted text-sm">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full bg-free opacity-60 animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-free" />
          </span>
          {baseList.length} evenimente active acum în București
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2.5 px-3.5 rounded-xl bg-surface border border-border focus-within:border-primary/50">
        <SearchIcon />
        <input
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          placeholder="Caută evenimente, locuri, artiști…"
          className="flex-1 bg-transparent outline-none py-3 text-sm text-foreground placeholder:text-muted"
        />
        {filters.search && (
          <button onClick={() => setFilters({ ...filters, search: "" })} className="text-muted hover:text-foreground" aria-label="Șterge căutarea">✕</button>
        )}
      </div>

      {/* Hero recomandat */}
      {featured && <Hero event={featured} saved={ids.has(featured.id)} onSave={() => toggle(featured.id)} />}

      {/* Categorii */}
      <div className="flex flex-wrap gap-2">
        <Chip active={!filters.categorySlug} onClick={() => setFilters({ ...filters, categorySlug: null })}>
          Toate <Count active={!filters.categorySlug}>{baseList.length}</Count>
        </Chip>
        {categories.map((c) => {
          const active = filters.categorySlug === c.slug;
          const count = baseList.filter((e) => e.category?.slug === c.slug).length;
          return (
            <Chip key={c.slug} active={active} onClick={() => setFilters({ ...filters, categorySlug: active ? null : c.slug })}>
              {c.name} <Count active={active}>{count}</Count>
            </Chip>
          );
        })}
      </div>

      {/* Filtre: când / preț / lângă mine */}
      <div className="flex items-center gap-x-5 gap-y-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Label>CÂND</Label>
          {DATE_PILLS.map((d) => (
            <Chip key={d.val} active={filters.quick === d.val} onClick={() => setQuick(d.val)}>{d.label}</Chip>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Label>PREȚ</Label>
          <Chip active={filters.free} onClick={toggleFree}>Gratis</Chip>
          <Chip active={filters.maxPrice === 50} onClick={() => setMax(50)}>Sub 50 lei</Chip>
          <Chip active={filters.maxPrice === 100} onClick={() => setMax(100)}>Sub 100 lei</Chip>
        </div>
        <Chip active={filters.nearMe} onClick={() => setFilters({ ...filters, nearMe: !filters.nearMe })}>
          <PinSmall /> {locating ? "Te caut…" : "Lângă mine"}
        </Chip>
      </div>

      {/* Count + view toggle */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          <span className="text-foreground font-bold">{filtered.length}</span> evenimente
        </p>
        <div className="flex p-1 rounded-xl bg-surface border border-border gap-1">
          <Seg active={view === "grid"} onClick={() => setView("grid")}><GridIcon /> Grilă</Seg>
          <Seg active={view === "list"} onClick={() => setView("list")}><ListIcon /> Listă</Seg>
        </div>
      </div>

      {/* Lista */}
      {gridEvents.length === 0 && !featured ? (
        <Empty onReset={() => setFilters(EMPTY_FILTERS)} />
      ) : (
        <div
          className={
            view === "grid"
              ? "grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]"
              : "flex flex-col gap-3.5"
          }
        >
          {gridEvents.map((e) => (
            <EventCardNew key={e.id} event={e} view={view} saved={ids.has(e.id)} onToggleSave={toggle} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Hero ---- */
function Hero({ event, saved, onSave }: { event: EventWithRelations; saved: boolean; onSave: () => void }) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 sm:p-9 min-h-[248px] flex"
      style={
        event.image_url
          ? { backgroundImage: `url(${event.image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: catGradient(event.category?.slug) }
      }
    >
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,rgba(8,6,14,0.82) 0%,rgba(8,6,14,0.3) 55%,rgba(8,6,14,0.05) 100%)" }} />
      <div className="relative flex flex-col justify-between gap-6 w-full">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold text-white" style={{ background: "rgba(255,75,75,0.92)" }}>
            <span className="w-[7px] h-[7px] rounded-full bg-white" /> RECOMANDAT AZI
          </span>
          <span className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur border border-white/15 text-[12px] font-semibold text-white">
            {event.category?.name ?? "Eveniment"}
          </span>
        </div>
        <div>
          <h2 className="font-display font-bold text-white text-2xl sm:text-[40px] leading-[1.02] tracking-tight max-w-2xl text-balance">
            {event.title}
          </h2>
          <div className="flex items-center gap-4 flex-wrap mt-3.5 text-white/80 text-sm font-medium">
            <span className="inline-flex items-center gap-1.5"><ClockMini /> {formatWhen(event.starts_at)}</span>
            <span className="inline-flex items-center gap-1.5"><PinSmall /> {event.venue?.name ?? "București"}</span>
            <span className="font-mono font-bold text-white">{formatPrice(event)}</span>
          </div>
          <div className="flex items-center gap-3 mt-5 flex-wrap">
            <Link href={`/event/${event.id}`} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-foreground text-background text-sm font-bold">
              Vezi detalii
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>
            </Link>
            <button onClick={onSave} className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-semibold ${saved ? "text-accent border-white/25 bg-white/10" : "text-white border-white/25 bg-white/10"}`}>
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l8.8 8.6 8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
              {saved ? "Salvat" : "Salvează"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Bucățele UI ---- */
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13.5px] font-semibold whitespace-nowrap border transition-colors ${
        active
          ? "text-white border-transparent"
          : "text-muted border-border bg-surface/60 hover:text-foreground"
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
function Seg({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold ${active ? "text-white" : "text-muted"}`} style={active ? { background: "linear-gradient(135deg, oklch(0.78 0.15 292), oklch(0.6 0.2 292))" } : undefined}>
      {children}
    </button>
  );
}
function Empty({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3.5 py-16 px-5 text-center border border-dashed border-border rounded-3xl">
      <div className="w-14 h-14 rounded-2xl bg-surface grid place-items-center"><SearchIcon /></div>
      <div className="font-display font-bold text-lg">Niciun eveniment găsit</div>
      <p className="text-sm text-muted max-w-xs">Încearcă să schimbi categoria, prețul sau data ca să vezi mai multe.</p>
      <button onClick={onReset} className="mt-1 px-5 py-2.5 rounded-xl bg-surface border border-border text-sm font-semibold">Resetează filtrele</button>
    </div>
  );
}

/* ---- Iconițe ---- */
function SearchIcon() {
  return <svg className="w-4 h-4 text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>;
}
function GridIcon() {
  return <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
}
function ListIcon() {
  return <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>;
}
function PinSmall() {
  return <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z" /><circle cx="12" cy="9" r="2.2" /></svg>;
}
function ClockMini() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}

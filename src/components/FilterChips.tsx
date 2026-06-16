"use client";

import type { Category } from "@/types";
import type { ActiveFilters, QuickFilter } from "@/lib/filters";

interface Props {
  filters: ActiveFilters;
  categories: Category[];
  locating: boolean;
  onChange: (next: ActiveFilters) => void;
}

const QUICK: { key: QuickFilter; label: string }[] = [
  { key: "tonight", label: "Diseară" },
  { key: "tomorrow", label: "Mâine" },
  { key: "weekend", label: "Weekend" },
];

// "2026-06-19" (formatul intern al input-ului) -> "19-06-2026" (pentru afișare).
function toDisplay(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

// Rezumatul intervalului ales, scris ca dd-mm-yyyy.
function rangeLabel(from: string | null, to: string | null): string {
  if (from && to) return `${toDisplay(from)} → ${toDisplay(to)}`;
  if (from) return `din ${toDisplay(from)}`;
  if (to) return `până la ${toDisplay(to)}`;
  return "";
}

export default function FilterChips({
  filters,
  categories,
  locating,
  onChange,
}: Props) {
  // Filtrele rapide și intervalul personalizat se exclud reciproc
  // (ambele filtrează după dată). Activarea unuia îl golește pe celălalt.
  function toggleQuick(key: QuickFilter) {
    onChange({
      ...filters,
      quick: filters.quick === key ? null : key,
      dateFrom: null,
      dateTo: null,
    });
  }

  const hasRange = Boolean(filters.dateFrom || filters.dateTo);

  // Preț: „Gratis" și „preț maxim" se exclud reciproc (Gratis = strict gratuit).
  function toggleFree() {
    const next = !filters.free;
    onChange({ ...filters, free: next, maxPrice: next ? null : filters.maxPrice });
  }

  function setMaxPrice(value: number | null) {
    onChange({ ...filters, maxPrice: value, free: false });
  }

  return (
    <div className="space-y-3">
      {/* === Data: filtre rapide + interval personalizat === */}
      <Section label="Data">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {QUICK.map(({ key, label }) => (
            <Chip
              key={key}
              active={filters.quick === key}
              onClick={() => toggleQuick(key)}
            >
              {label}
            </Chip>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted">Interval:</span>
          <input
            type="date"
            aria-label="De la data"
            value={filters.dateFrom ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                dateFrom: e.target.value || null,
                quick: e.target.value ? null : filters.quick,
              })
            }
            className="rounded-lg border border-border bg-surface text-foreground text-sm px-2 py-1"
          />
          <span className="text-muted">–</span>
          <input
            type="date"
            aria-label="Până la data"
            min={filters.dateFrom ?? undefined}
            value={filters.dateTo ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                dateTo: e.target.value || null,
                quick: e.target.value ? null : filters.quick,
              })
            }
            className="rounded-lg border border-border bg-surface text-foreground text-sm px-2 py-1"
          />
          {hasRange && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, dateFrom: null, dateTo: null })}
              className="text-sm text-primary underline underline-offset-2"
            >
              Șterge
            </button>
          )}
        </div>
        {hasRange && (
          <p className="text-sm text-muted">
            {rangeLabel(filters.dateFrom, filters.dateTo)}
          </p>
        )}
      </Section>

      {/* === Preț === */}
      <Section label="Preț">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <Chip active={filters.free} onClick={toggleFree}>
            Gratis
          </Chip>
          <Chip
            active={filters.maxPrice === 50}
            onClick={() => setMaxPrice(filters.maxPrice === 50 ? null : 50)}
          >
            Sub 50 lei
          </Chip>
          <Chip
            active={filters.maxPrice === 100}
            onClick={() => setMaxPrice(filters.maxPrice === 100 ? null : 100)}
          >
            Sub 100 lei
          </Chip>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Preț maxim:</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="orice"
            aria-label="Preț maxim în lei"
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              setMaxPrice(e.target.value === "" ? null : Number(e.target.value))
            }
            className="w-24 rounded-lg border border-border bg-surface text-foreground text-sm px-2 py-1"
          />
          <span className="text-sm text-muted">lei</span>
        </div>
      </Section>

      {/* === Distanță === */}
      <Section label="Distanță">
        <div className="flex gap-2">
          <Chip
            active={filters.nearMe}
            onClick={() => onChange({ ...filters, nearMe: !filters.nearMe })}
          >
            {locating ? "Caut locația…" : "Lângă mine"}
          </Chip>
        </div>
      </Section>

      {/* === Categorie === */}
      <Section label="Categorie">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <Chip
            active={filters.categorySlug === null}
            onClick={() => onChange({ ...filters, categorySlug: null })}
            small
          >
            Toate
          </Chip>
          {categories.map((c) => (
            <Chip
              key={c.id}
              active={filters.categorySlug === c.slug}
              onClick={() =>
                onChange({
                  ...filters,
                  categorySlug:
                    filters.categorySlug === c.slug ? null : c.slug,
                })
              }
              small
            >
              {c.name}
            </Chip>
          ))}
        </div>
      </Section>
    </div>
  );
}

// O secțiune de filtre cu o etichetă mică deasupra (Data / Preț / Distanță / Categorie).
function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  small,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border whitespace-nowrap transition-colors ${
        small ? "px-3 py-1 text-sm" : "px-4 py-1.5 text-sm font-medium"
      } ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-surface text-foreground border-border"
      }`}
    >
      {children}
    </button>
  );
}

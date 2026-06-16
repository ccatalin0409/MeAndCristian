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

export default function FilterChips({
  filters,
  categories,
  locating,
  onChange,
}: Props) {
  function toggleQuick(key: QuickFilter) {
    onChange({ ...filters, quick: filters.quick === key ? null : key });
  }

  return (
    <div className="space-y-2">
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
        <Chip
          active={filters.free}
          onClick={() => onChange({ ...filters, free: !filters.free })}
        >
          Gratis
        </Chip>
        <Chip
          active={filters.nearMe}
          onClick={() => onChange({ ...filters, nearMe: !filters.nearMe })}
        >
          {locating ? "Caut locația…" : "Lângă mine"}
        </Chip>
      </div>

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

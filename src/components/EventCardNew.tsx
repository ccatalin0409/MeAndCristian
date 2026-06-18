"use client";

import Link from "next/link";
import type { EventWithRelations } from "@/types";
import { formatPrice, formatWhen } from "@/lib/format";
import { catColor, catGradient } from "@/lib/categoryStyle";

interface Props {
  event: EventWithRelations;
  view: "grid" | "list";
  saved: boolean;
  onToggleSave: (id: string) => void;
}

export default function EventCardNew({ event, view, saved, onToggleSave }: Props) {
  const cat = event.category?.slug;
  const catName = event.category?.name ?? "Eveniment";
  const color = catColor(cat);
  const free = event.is_free;
  const isGrid = view === "grid";

  const poster = (
    <div
      className={`relative flex flex-col justify-between overflow-hidden ${
        isGrid ? "h-52 p-3.5" : "w-32 sm:w-40 shrink-0 self-stretch min-h-[140px] p-3"
      }`}
      style={
        event.image_url
          ? { backgroundImage: `url(${event.image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: catGradient(cat) }
      }
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60" />
      <div className="relative flex items-start justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur border border-white/20 text-[11px] font-bold text-white">
          <span className="w-[7px] h-[7px] rounded-full" style={{ background: color }} />
          {catName}
        </span>
        <span
          className={`px-2.5 py-1.5 rounded-full font-mono text-[11px] font-bold whitespace-nowrap ${
            free ? "text-[#06281c]" : "text-white border border-white/20 bg-black/40 backdrop-blur"
          }`}
          style={free ? { background: "rgba(52,211,153,0.92)" } : undefined}
        >
          {formatPrice(event)}
        </span>
      </div>
      {isGrid && (
        <h3 className="relative font-display font-bold text-[19px] leading-[1.06] text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.45)] text-balance">
          {event.title}
        </h3>
      )}
    </div>
  );

  const body = (
    <div
      className={`flex flex-col gap-2 ${
        isGrid ? "p-4" : "py-3.5 px-4 justify-center min-w-0 flex-1"
      }`}
    >
      {!isGrid && (
        <h3 className="font-display font-bold text-[17px] leading-tight text-balance line-clamp-2">
          {event.title}
        </h3>
      )}
      <div className="inline-flex items-center gap-1.5 text-[13px] font-bold" style={{ color }}>
        <ClockIcon />
        {formatWhen(event.starts_at)}
      </div>
      <div className="flex items-center gap-1.5 text-[13px] text-muted min-w-0">
        <PinIcon />
        <span className="truncate">{event.venue?.name ?? "București"}</span>
      </div>
      <div className="flex items-center justify-end mt-auto pt-1">
        <button
          type="button"
          aria-label={saved ? "Scoate din salvate" : "Salvează"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSave(event.id);
          }}
          className={`grid place-items-center w-9 h-9 rounded-xl border transition-colors ${
            saved
              ? "text-accent border-accent/45 bg-accent/15"
              : "text-muted border-border bg-surface hover:text-foreground"
          }`}
        >
          <HeartIcon filled={saved} />
        </button>
      </div>
    </div>
  );

  return (
    <Link
      href={`/event/${event.id}`}
      className={`group flex bg-surface border border-border rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_18px_44px_rgba(0,0,0,0.5)] ${
        isGrid ? "flex-col" : "flex-row"
      }`}
    >
      {poster}
      {body}
    </Link>
  );
}

function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5l3 1.8" /></svg>
  );
}
function PinIcon() {
  return (
    <svg className="w-3.5 h-3.5 opacity-70 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z" /><circle cx="12" cy="9" r="2.2" /></svg>
  );
}
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l8.8 8.6 8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
  );
}

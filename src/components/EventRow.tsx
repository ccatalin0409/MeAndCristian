import Link from "next/link";
import type { EventWithRelations } from "@/types";
import { formatPrice, formatWhen } from "@/lib/format";
import { CATEGORY_EMOJI } from "@/components/EventCard";

// Rând detaliat pentru modul „Listă": orizontal, pe toată lățimea,
// cu miniatură + mai multe detalii (loc, descriere) decât cardul din grilă.
export default function EventRow({ event }: { event: EventWithRelations }) {
  const emoji = event.category ? CATEGORY_EMOJI[event.category.slug] ?? "📍" : "📍";

  return (
    <Link
      href={`/event/${event.id}`}
      className="flex gap-3 bg-surface rounded-2xl border border-border p-3 active:scale-[0.99] transition-transform"
    >
      <div className="relative h-24 w-24 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
        {event.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image_url}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-3xl select-none">{emoji}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-primary">
            {formatWhen(event.starts_at)}
          </p>
          <span
            className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              event.is_free
                ? "bg-free text-white"
                : "bg-background text-foreground border border-border"
            }`}
          >
            {formatPrice(event)}
          </span>
        </div>

        <h3 className="mt-0.5 font-semibold leading-snug line-clamp-2">
          {event.title}
        </h3>

        {event.venue && (
          <p className="mt-1 text-sm text-muted line-clamp-1">
            {event.venue.name}
            {event.venue.address ? ` · ${event.venue.address}` : ""}
          </p>
        )}

        {event.description && (
          <p className="mt-1 text-sm text-muted line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="mt-1.5 flex gap-2">
          {event.is_promoted && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent text-white">
              Promovat
            </span>
          )}
          {event.category && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-border text-muted">
              {event.category.name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

import Link from "next/link";
import type { EventWithRelations } from "@/types";
import { formatPrice, formatWhen } from "@/lib/format";

// Emoji per categorie pentru placeholder vizual când nu există imagine.
export const CATEGORY_EMOJI: Record<string, string> = {
  concerte: "🎵",
  "stand-up": "🎤",
  teatru: "🎭",
  expozitii: "🖼️",
  targuri: "🛍️",
  party: "🎉",
  family: "🧸",
  film: "🎬",
};

export default function EventCard({ event }: { event: EventWithRelations }) {
  const emoji = event.category ? CATEGORY_EMOJI[event.category.slug] ?? "📍" : "📍";

  return (
    <Link
      href={`/event/${event.id}`}
      className="block bg-surface rounded-2xl border border-border overflow-hidden active:scale-[0.99] transition-transform"
    >
      <div className="relative h-40 w-full bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
        {event.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image_url}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-5xl select-none">{emoji}</span>
        )}

        <div className="absolute top-2 left-2 flex gap-2">
          {event.is_promoted && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent text-white">
              Promovat
            </span>
          )}
          {event.category && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-black/55 text-white">
              {event.category.name}
            </span>
          )}
        </div>

        <span
          className={`absolute top-2 right-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            event.is_free
              ? "bg-free text-white"
              : "bg-surface/90 text-foreground border border-border"
          }`}
        >
          {formatPrice(event)}
        </span>
      </div>

      <div className="p-3">
        <p className="text-xs font-medium text-primary">
          {formatWhen(event.starts_at)}
        </p>
        <h3 className="mt-0.5 font-semibold leading-snug line-clamp-2">
          {event.title}
        </h3>
        {event.venue && (
          <p className="mt-1 text-sm text-muted line-clamp-1">
            {event.venue.name}
          </p>
        )}
      </div>
    </Link>
  );
}

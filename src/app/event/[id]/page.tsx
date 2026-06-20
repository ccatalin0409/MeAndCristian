import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventById } from "@/lib/events";
import { formatFullDate, formatPrice, formatTime } from "@/lib/format";
import SaveButton from "@/components/SaveButton";
import ShareButton from "@/components/ShareButton";
import NavigateButton from "@/components/NavigateButton";
import EventMiniMap from "@/components/EventMiniMap";

export const dynamic = "force-dynamic";

const CATEGORY_EMOJI: Record<string, string> = {
  concerte: "🎵",
  "stand-up": "🎤",
  teatru: "🎭",
  expozitii: "🖼️",
  targuri: "🛍️",
  party: "🎉",
  family: "🧸",
  film: "🎬",
};

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event || event.status === "hidden") notFound();

  const emoji = event.category
    ? CATEGORY_EMOJI[event.category.slug] ?? "📍"
    : "📍";
  const hasCoords = event.venue?.lat != null && event.venue?.lng != null;

  return (
    <main className="pb-6">
      {/* Imagine mare — poster pe fundal blurat, afișat integral (fără deformare) */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[2/1] max-h-[58vh] overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        {event.image_url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.image_url}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-50"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.image_url}
              alt={event.title}
              className="relative h-full w-auto max-w-full object-contain"
            />
          </>
        ) : (
          <span className="text-7xl select-none">{emoji}</span>
        )}
        <Link
          href="/"
          className="absolute top-3 left-3 grid place-items-center w-9 h-9 rounded-full bg-surface/90 border border-border text-lg"
          aria-label="Înapoi"
        >
          ←
        </Link>
        <div className="absolute top-3 right-3">
          <SaveButton eventId={event.id} variant="icon" />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {event.category && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
              {event.category.name}
            </span>
          )}
          {event.is_promoted && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent text-white">
              Promovat
            </span>
          )}
          {event.is_family_friendly && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-free/10 text-free">
              Potrivit copiilor
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold leading-tight">{event.title}</h1>

        <div className="space-y-1.5 text-sm">
          <p className="flex items-center gap-2">
            <span>🗓️</span>
            <span className="capitalize">{formatFullDate(event.starts_at)}</span>
            <span className="text-muted">· {formatTime(event.starts_at)}</span>
          </p>
          {event.venue && (
            <p className="flex items-center gap-2">
              <span>📍</span>
              <span>{event.venue.name}</span>
              {event.venue.address && (
                <span className="text-muted">· {event.venue.address}</span>
              )}
            </p>
          )}
          <p className="flex items-center gap-2">
            <span>🎟️</span>
            <span className={event.is_free ? "text-free font-medium" : ""}>
              {formatPrice(event)}
            </span>
          </p>
        </div>

        {event.description && (
          <p className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-line">
            {event.description}
          </p>
        )}

        {hasCoords && <EventMiniMap event={event} />}

        {/* Acțiuni */}
        <div className="space-y-2 pt-1">
          {event.ticket_url && (
            <a
              href={event.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full py-3 rounded-xl font-semibold bg-primary text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(124,92,252,0.45)] active:translate-y-0"
            >
              Bilete →
            </a>
          )}
          <SaveButton eventId={event.id} />
          {event.venue && (
            <NavigateButton
              lat={event.venue.lat}
              lng={event.venue.lng}
              venueName={event.venue.name}
              venueAddress={event.venue.address}
            />
          )}
          <ShareButton
            title={event.title}
            text={`${event.title}${event.venue ? ` · ${event.venue.name}` : ""}`}
          />
        </div>
      </div>
    </main>
  );
}

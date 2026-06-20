"use client";

interface Props {
  lat?: number | null;
  lng?: number | null;
  venueName?: string | null;
  venueAddress?: string | null;
}

function buildUrl(lat: number | null | undefined, lng: number | null | undefined, label: string): string {
  const ua = navigator.userAgent;
  const hasCoords = lat != null && lng != null;

  if (/iphone|ipad|ipod/i.test(ua)) {
    return hasCoords
      ? `maps://maps.apple.com/?daddr=${lat},${lng}`
      : `maps://maps.apple.com/?q=${encodeURIComponent(label)}`;
  }

  if (/android/i.test(ua)) {
    return hasCoords
      ? `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})`
      : `geo:0,0?q=${encodeURIComponent(label)}`;
  }

  const dest = hasCoords ? `${lat},${lng}` : encodeURIComponent(label);
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
}

export default function NavigateButton({ lat, lng, venueName, venueAddress }: Props) {
  const label = [venueName, venueAddress].filter(Boolean).join(", ");
  if (!lat && !lng && !label) return null;

  function handleNavigate() {
    const url = buildUrl(lat, lng, label);
    // window.open e blocat de popup-blocker — folosim un <a> real
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <button
      onClick={handleNavigate}
      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold border border-border bg-surface text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
      Navighează
    </button>
  );
}

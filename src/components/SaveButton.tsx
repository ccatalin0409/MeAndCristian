"use client";

import { useSavedEvents } from "@/lib/useSavedEvents";

export default function SaveButton({
  eventId,
  variant = "full",
}: {
  eventId: string;
  variant?: "full" | "icon";
}) {
  const { isSaved, toggle, ready } = useSavedEvents();
  const saved = isSaved(eventId);

  if (variant === "icon") {
    return (
      <button
        type="button"
        aria-label={saved ? "Scoate din salvate" : "Salvează"}
        onClick={() => toggle(eventId)}
        className="grid place-items-center w-10 h-10 rounded-full bg-surface border border-border"
      >
        <Heart filled={saved} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle(eventId)}
      disabled={!ready}
      className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium border transition-colors ${
        saved
          ? "bg-accent/10 text-accent border-accent"
          : "bg-surface text-foreground border-border"
      }`}
    >
      <Heart filled={saved} />
      {saved ? "Salvat" : "Salvează"}
    </button>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M12 20s-7-4.5-9.5-9A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9.5 5c-2.5 4.5-9.5 9-9.5 9Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

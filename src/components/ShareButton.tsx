"use client";

import { useState } from "react";

interface Props {
  title: string;
  text: string;
}

export default function ShareButton({ title, text }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;

    // Web Share API — deschide sheet-ul nativ pe telefon (WhatsApp, SMS etc.)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // userul a anulat — nu facem nimic
      }
      return;
    }

    // Fallback desktop: copiază link-ul în clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponibil (http:// fără HTTPS) — ignorăm
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold border border-border bg-surface text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      {copied ? (
        <>
          <span>✓</span>
          Link copiat!
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Trimite unui prieten
        </>
      )}
    </button>
  );
}

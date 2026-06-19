"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "cfio_install_dismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    setDismissed(false);

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    if (isIOS()) setShowIOS(true);

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  function close() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    close();
  }

  if (dismissed) return null;
  if (!deferred && !showIOS) return null;

  return (
    <div className="fixed bottom-20 inset-x-0 z-[1100] px-3">
      <div className="max-w-2xl mx-auto bg-surface border border-border rounded-2xl shadow-lg p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 grid place-items-center text-xl shrink-0">
          📲
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Instalează „Ce fac în oraș"</p>
          {deferred ? (
            <p className="text-xs text-muted">
              Adaug-o pe ecranul principal pentru acces rapid.
            </p>
          ) : (
            <p className="text-xs text-muted">
              Apasă Partajează, apoi „Adaugă pe ecranul principal".
            </p>
          )}
        </div>
        {deferred && (
          <button
            onClick={install}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
          >
            Adaugă
          </button>
        )}
        <button
          onClick={close}
          aria-label="Închide"
          className="shrink-0 w-8 h-8 grid place-items-center text-muted"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
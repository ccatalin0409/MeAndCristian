"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSavedEvents } from "@/lib/useSavedEvents";

// Shell-ul aplicației după designul „Ce fac diseară": sidebar pe desktop,
// bottom-nav pe mobil, header lipicios cu orașul + acțiuni. Conținutul fiecărei
// pagini se randează în zona centrală.

const NAV = [
  { href: "/", label: "Acasă", icon: HomeIcon },
  { href: "/map", label: "Hartă", icon: MapIcon },
  { href: "/saved", label: "Salvate", icon: HeartIcon },
  { href: "/settings", label: "Setări", icon: SlidersIcon },
  { href: "/admin", label: "Admin", icon: ShieldIcon },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const isActive = useIsActive();
  const { ids } = useSavedEvents();
  const savedCount = ids.size;

  return (
    <div className="flex min-h-screen">
      {/* ---- Sidebar (desktop) ---- */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-0 h-screen px-4 py-6 border-r border-border">
        <Link href="/" className="flex items-center gap-3 px-1">
          <Logo />
          <div>
            <div className="font-display font-bold text-[15px] leading-none">
              Ce fac în oraș
            </div>
            <div className="font-mono text-[10px] tracking-widest text-muted mt-1.5">
              BUCUREȘTI · LIVE
            </div>
          </div>
        </Link>

        <nav className="flex flex-col gap-1 mt-8">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  active
                    ? "bg-primary/15 text-foreground font-medium ring-1 ring-primary/30"
                    : "text-muted hover:text-foreground hover:bg-surface"
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
                <span>{label}</span>
                {href === "/saved" && savedCount > 0 && (
                  <span className="ml-auto font-mono text-[11px] font-bold text-accent">
                    {savedCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl p-4 bg-primary/10 border border-primary/20">
          <div className="font-display font-bold text-[15px] leading-tight">
            Organizezi un eveniment?
          </div>
          <p className="text-[12.5px] text-muted mt-1.5 leading-snug">
            Publică-l și ajunge la mii de bucureșteni.
          </p>
          <Link
            href="/admin/new"
            className="inline-flex items-center gap-2 mt-3.5 px-3.5 py-2 rounded-xl bg-foreground text-background text-[13px] font-bold"
          >
            Adaugă eveniment
          </Link>
        </div>
      </aside>

      {/* ---- Zona principală ---- */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 py-3 bg-background/70 backdrop-blur-xl border-b border-border pt-safe">
          <Link href="/" className="lg:hidden">
            <Logo small />
          </Link>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-border text-sm font-semibold">
            <PinIcon className="w-[15px] h-[15px] text-primary" />
            București
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <span className="hidden sm:grid place-items-center w-10 h-10 rounded-xl bg-surface border border-border text-muted">
              <BellIcon className="w-[18px] h-[18px]" />
            </span>
            <Link
              href="/settings"
              aria-label="Cont"
              className="w-10 h-10 rounded-full grid place-items-center text-background font-bold text-[13px]"
              style={{ background: "linear-gradient(140deg,#F0A1C4,#A78BFA)" }}
            >
              EU
            </Link>
          </div>
        </header>

        <div className="flex-1 w-full mx-auto max-w-5xl px-4 sm:px-6 pt-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-12">
          {children}
        </div>
      </div>

      {/* ---- Bottom-nav (mobil) ---- */}
      <nav className="lg:hidden fixed inset-x-0 bottom-0 z-40 flex bg-surface/90 backdrop-blur-xl border-t border-border px-2 pb-safe">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10.5px] font-semibold ${
                active ? "text-primary" : "text-muted"
              }`}
            >
              <Icon className="w-[22px] h-[22px]" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function Logo({ small }: { small?: boolean }) {
  return (
    <div
      className={`${
        small ? "w-9 h-9 text-[17px]" : "w-10 h-10 text-[20px]"
      } rounded-xl grid place-items-center font-display font-bold text-white shrink-0`}
      style={{
        background: "linear-gradient(140deg,#A78BFA,#7C5CFC)",
        boxShadow: "0 8px 22px rgba(124,92,252,0.45)",
      }}
    >
      C
    </div>
  );
}

/* ---- Iconițe ---- */
type IP = { className?: string };
function HomeIcon({ className }: IP) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>
  );
}
function MapIcon({ className }: IP) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z" /><circle cx="12" cy="9" r="2.4" /></svg>
  );
}
function HeartIcon({ className }: IP) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l8.8 8.6 8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
  );
}
function SlidersIcon({ className }: IP) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h11M19 8h1M4 16h5M13 16h7" /><circle cx="16" cy="8" r="2.2" /><circle cx="10" cy="16" r="2.2" /></svg>
  );
}
function ShieldIcon({ className }: IP) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6Z" /></svg>
  );
}
function BellIcon({ className }: IP) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
  );
}
function PinIcon({ className }: IP) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z" /><circle cx="12" cy="9" r="2.4" /></svg>
  );
}

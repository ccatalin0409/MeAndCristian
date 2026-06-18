export default function MapLoading() {
  return (
    <main className="px-4 pt-4">
      <header className="mb-3">
        <div className="h-8 w-24 rounded-lg bg-surface animate-pulse" />
        <div className="h-4 w-56 rounded-md bg-surface animate-pulse mt-1" />
      </header>

      <div className="h-10 w-full rounded-xl bg-surface animate-pulse mb-3" />

      <div className="space-y-3 mb-3">
        <div className="flex gap-2">
          {[80, 64, 96].map((w) => (
            <div key={w} className="h-8 rounded-full bg-surface animate-pulse" style={{ width: w }} />
          ))}
        </div>
        <div className="flex gap-2">
          {[72, 88, 80].map((w) => (
            <div key={w} className="h-8 rounded-full bg-surface animate-pulse" style={{ width: w }} />
          ))}
        </div>
      </div>

      <div className="h-[65vh] rounded-2xl bg-surface border border-border animate-pulse grid place-items-center">
        <p className="text-muted text-sm">Se încarcă harta…</p>
      </div>
    </main>
  );
}

export default function HomeLoading() {
  return (
    <main className="px-4 pt-4">
      <header className="mb-3">
        <div className="h-8 w-48 rounded-lg bg-surface animate-pulse" />
        <div className="h-4 w-36 rounded-md bg-surface animate-pulse mt-1" />
      </header>

      <div className="h-10 w-full rounded-xl bg-surface animate-pulse mb-3" />

      <div className="space-y-3 mb-3">
        <div className="flex gap-2">
          {[80, 64, 96].map((w) => (
            <div key={w} className="h-8 rounded-full bg-surface animate-pulse" style={{ width: w }} />
          ))}
        </div>
        <div className="flex gap-2">
          {[72, 88, 80, 96].map((w) => (
            <div key={w} className="h-8 rounded-full bg-surface animate-pulse" style={{ width: w }} />
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface overflow-hidden animate-pulse">
            <div className="h-36 bg-border" />
            <div className="p-3 space-y-2">
              <div className="h-4 w-3/4 rounded bg-border" />
              <div className="h-3 w-1/2 rounded bg-border" />
              <div className="h-3 w-1/3 rounded bg-border" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

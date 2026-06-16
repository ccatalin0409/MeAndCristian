import Link from "next/link";
import { getAdminStatus } from "@/lib/admin";
import { getAllEventsForAdmin } from "@/lib/events";
import { getSources } from "@/lib/reference";
import { formatWhen } from "@/lib/format";
import { addSource, deleteEvent } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const status = await getAdminStatus();

  // 1) Mod demo — fără Supabase nu se pot face scrieri.
  if (!status.configured) {
    return (
      <Shell>
        <Notice tone="amber">
          Adminul are nevoie de Supabase configurat ca să poți adăuga/edita
          evenimente. Vezi <code>README.md</code> → „Configurare Supabase".
          Mai jos vezi datele demo (doar citire).
        </Notice>
        <DemoList />
      </Shell>
    );
  }

  // 2) Neautentificat
  if (!status.email) {
    return (
      <Shell>
        <Notice tone="violet">
          Trebuie să te autentifici ca să intri în admin.
        </Notice>
        <Link
          href="/login"
          className="inline-block px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium"
        >
          Intră în cont
        </Link>
      </Shell>
    );
  }

  // 3) Autentificat dar nu admin
  if (!status.isAdmin) {
    return (
      <Shell>
        <Notice tone="amber">
          Contul <strong>{status.email}</strong> nu are drepturi de admin.
          Adaugă-l în Supabase: tabelul <code>admins</code> →{" "}
          <code>insert (email)</code>, sau pune-l în env{" "}
          <code>ADMIN_EMAILS</code>.
        </Notice>
      </Shell>
    );
  }

  // 4) Admin — CRUD complet
  const [events, sources] = await Promise.all([
    getAllEventsForAdmin(),
    getSources(),
  ]);

  return (
    <Shell email={status.email}>
      <Link
        href="/admin/new"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium"
      >
        + Adaugă eveniment
      </Link>

      <section className="mt-5">
        <h2 className="text-sm font-semibold text-muted mb-2">
          Evenimente ({events.length})
        </h2>
        <div className="space-y-2">
          {events.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-3 bg-surface border border-border rounded-xl p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{e.title}</p>
                  <StatusBadge status={e.status} />
                </div>
                <p className="text-xs text-muted truncate">
                  {formatWhen(e.starts_at)}
                  {e.venue ? ` · ${e.venue.name}` : ""}
                </p>
              </div>
              <Link
                href={`/admin/${e.id}/edit`}
                className="text-sm px-3 py-1.5 rounded-lg border border-border"
              >
                Editează
              </Link>
              <form action={deleteEvent}>
                <input type="hidden" name="id" value={e.id} />
                <button className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600">
                  Șterge
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-muted mb-2">
          Surse de date ({sources.length})
        </h2>
        <div className="space-y-2">
          {sources.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between bg-surface border border-border rounded-xl p-3 text-sm"
            >
              <span>
                {s.name}{" "}
                <span className="text-muted">· {s.type}</span>
              </span>
              {s.url && (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary truncate max-w-[40%]"
                >
                  {s.url}
                </a>
              )}
            </div>
          ))}
        </div>

        <form
          action={addSource}
          className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] gap-2"
        >
          <input
            name="name"
            placeholder="Nume sursă (ex: iaBilet)"
            required
            className="px-3 py-2 rounded-lg border border-border bg-surface text-sm"
          />
          <select
            name="type"
            className="px-3 py-2 rounded-lg border border-border bg-surface text-sm"
          >
            <option value="manual">manual</option>
            <option value="scraper">scraper</option>
            <option value="feed">feed</option>
            <option value="partner">partner</option>
            <option value="user_submitted">user_submitted</option>
          </select>
          <input
            name="url"
            placeholder="https://…"
            className="px-3 py-2 rounded-lg border border-border bg-surface text-sm"
          />
          <button className="px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium">
            Adaugă
          </button>
        </form>
      </section>
    </Shell>
  );
}

function Shell({
  children,
  email,
}: {
  children: React.ReactNode;
  email?: string;
}) {
  return (
    <main className="px-4 pt-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="text-sm text-muted">
          {email ? `Conectat ca ${email}` : "Gestionează evenimentele"}
        </p>
      </header>
      {children}
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "bg-free/10 text-free",
    draft: "bg-amber-100 text-amber-700",
    hidden: "bg-gray-200 text-gray-600",
  };
  return (
    <span
      className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ${
        map[status] ?? "bg-gray-100"
      }`}
    >
      {status}
    </span>
  );
}

function Notice({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "amber" | "violet";
}) {
  const cls =
    tone === "amber"
      ? "bg-amber-50 border-amber-200 text-amber-800"
      : "bg-primary/5 border-primary/20 text-foreground";
  return (
    <div className={`mb-4 rounded-xl border px-3 py-2.5 text-sm ${cls}`}>
      {children}
    </div>
  );
}

async function DemoList() {
  const events = await getAllEventsForAdmin();
  return (
    <div className="space-y-2">
      {events.map((e) => (
        <div
          key={e.id}
          className="bg-surface border border-border rounded-xl p-3"
        >
          <p className="font-medium">{e.title}</p>
          <p className="text-xs text-muted">
            {formatWhen(e.starts_at)}
            {e.venue ? ` · ${e.venue.name}` : ""}
          </p>
        </div>
      ))}
    </div>
  );
}

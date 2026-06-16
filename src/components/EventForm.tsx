"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Category, City, EventWithRelations, Venue } from "@/types";
import { saveEvent, type ActionResult } from "@/app/admin/actions";

// ISO -> valoare pentru <input type="datetime-local"> (ora locală).
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

interface Props {
  event?: EventWithRelations;
  categories: Category[];
  venues: Venue[];
  cities: City[];
}

export default function EventForm({ event, categories, venues, cities }: Props) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(saveEvent, null);

  return (
    <form action={formAction} className="space-y-4">
      {event && <input type="hidden" name="id" value={event.id} />}
      <input
        type="hidden"
        name="city_id"
        value={event?.city_id ?? cities[0]?.id ?? ""}
      />

      <Field label="Titlu *">
        <input
          name="title"
          required
          defaultValue={event?.title ?? ""}
          className="input"
          placeholder="Concert indie la Arenele Romane"
        />
      </Field>

      <Field label="Descriere">
        <textarea
          name="description"
          rows={4}
          defaultValue={event?.description ?? ""}
          className="input"
          placeholder="Detalii scurte despre eveniment…"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Categorie">
          <select
            name="category_id"
            defaultValue={event?.category_id ?? ""}
            className="input"
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Loc">
          <select
            name="venue_id"
            defaultValue={event?.venue_id ?? ""}
            className="input"
          >
            <option value="">—</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Începe *">
          <input
            type="datetime-local"
            name="starts_at"
            required
            defaultValue={toLocalInput(event?.starts_at ?? null)}
            className="input"
          />
        </Field>
        <Field label="Se termină">
          <input
            type="datetime-local"
            name="ends_at"
            defaultValue={toLocalInput(event?.ends_at ?? null)}
            className="input"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Preț min (lei)">
          <input
            type="number"
            name="price_min"
            min="0"
            defaultValue={event?.price_min ?? ""}
            className="input"
          />
        </Field>
        <Field label="Preț max (lei)">
          <input
            type="number"
            name="price_max"
            min="0"
            defaultValue={event?.price_max ?? ""}
            className="input"
          />
        </Field>
      </div>

      <Field label="Link bilete (extern)">
        <input
          name="ticket_url"
          type="url"
          defaultValue={event?.ticket_url ?? ""}
          className="input"
          placeholder="https://www.iabilet.ro/..."
        />
      </Field>

      <Field label="Link imagine">
        <input
          name="image_url"
          type="url"
          defaultValue={event?.image_url ?? ""}
          className="input"
          placeholder="https://…/poster.jpg"
        />
      </Field>

      <div className="flex flex-wrap gap-4 text-sm">
        <Check name="is_free" label="Gratis" defaultChecked={event?.is_free} />
        <Check
          name="is_family_friendly"
          label="Potrivit copiilor"
          defaultChecked={event?.is_family_friendly}
        />
        <Check
          name="is_promoted"
          label="Promovat"
          defaultChecked={event?.is_promoted}
        />
      </div>

      <Field label="Status">
        <select
          name="status"
          defaultValue={event?.status ?? "published"}
          className="input"
        >
          <option value="draft">Draft (ascuns)</option>
          <option value="published">Publicat</option>
          <option value="hidden">Ascuns</option>
        </select>
      </Field>

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50"
        >
          {pending ? "Se salvează…" : event ? "Salvează" : "Adaugă eveniment"}
        </button>
        <Link
          href="/admin"
          className="px-4 py-3 rounded-xl border border-border text-center"
        >
          Anulează
        </Link>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.6rem 0.75rem;
          border-radius: 0.6rem;
          border: 1px solid var(--border);
          background: var(--surface);
          font-size: 0.95rem;
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Check({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="w-4 h-4 accent-[var(--primary)]"
      />
      {label}
    </label>
  );
}

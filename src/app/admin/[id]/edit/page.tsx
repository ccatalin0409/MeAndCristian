import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminStatus } from "@/lib/admin";
import { getEventById } from "@/lib/events";
import { getCategories, getCities, getVenues } from "@/lib/reference";
import EventForm from "@/components/EventForm";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const status = await getAdminStatus();
  if (!status.isAdmin) {
    return (
      <main className="px-4 pt-10 text-center">
        <p className="text-muted">Nu ai drepturi de admin.</p>
        <Link href="/admin" className="text-primary text-sm">
          Înapoi la admin
        </Link>
      </main>
    );
  }

  const { id } = await params;
  const [event, categories, venues, cities] = await Promise.all([
    getEventById(id),
    getCategories(),
    getVenues(),
    getCities(),
  ]);

  if (!event) notFound();

  return (
    <main className="px-4 pt-4">
      <Link href="/admin" className="text-sm text-muted">
        ← Admin
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">Editează eveniment</h1>
      <EventForm
        event={event}
        categories={categories}
        venues={venues}
        cities={cities}
      />
    </main>
  );
}

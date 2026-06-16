import Link from "next/link";
import { getAdminStatus } from "@/lib/admin";
import { getCategories, getCities, getVenues } from "@/lib/reference";
import EventForm from "@/components/EventForm";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const status = await getAdminStatus();
  if (!status.isAdmin) return <Denied />;

  const [categories, venues, cities] = await Promise.all([
    getCategories(),
    getVenues(),
    getCities(),
  ]);

  return (
    <main className="px-4 pt-4">
      <Link href="/admin" className="text-sm text-muted">
        ← Admin
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">Adaugă eveniment</h1>
      <EventForm categories={categories} venues={venues} cities={cities} />
    </main>
  );
}

function Denied() {
  return (
    <main className="px-4 pt-10 text-center">
      <p className="text-muted">Nu ai drepturi de admin.</p>
      <Link href="/admin" className="text-primary text-sm">
        Înapoi la admin
      </Link>
    </main>
  );
}

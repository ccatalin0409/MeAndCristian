import FeedDark from "@/components/FeedDark";
import { getPublishedEvents } from "@/lib/events";
import { getCategories } from "@/lib/reference";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [events, categories] = await Promise.all([
    getPublishedEvents(),
    getCategories(),
  ]);

  return <FeedDark events={events} categories={categories} />;
}

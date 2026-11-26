import { SWRConfig } from "swr";
import { GET as listEventsRoute } from "@/app/api/events/route";
import { absoluteUrl } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";

/** How many events go into the first HTML. The browser refetches the full list on mount. */
const FIRST_PAGE = 24;

type ListedEvent = { id: string; slug?: string | null; title?: string | null };

/**
 * Loads the first events for an events list page on the server, through the
 * same handler as GET /api/events (so the viewer, filters and shape match),
 * and hands them to SWR as fallback data for that exact key. Search engines
 * and slow phones then get real event cards in the first HTML instead of a
 * loading skeleton. Also adds an ItemList of those events for search.
 */
export async function InitialEvents({ query = "", children }: { query?: string; children: React.ReactNode }) {
  const key = `/api/events?${query}`;
  let events: ListedEvent[] = [];

  try {
    const res = await listEventsRoute(new Request(absoluteUrl(key)));
    if (res.ok) {
      const json = (await res.json()) as { events?: ListedEvent[] } | ListedEvent[];
      const list = Array.isArray(json) ? json : json.events;
      if (Array.isArray(list)) events = list.slice(0, FIRST_PAGE);
    }
  } catch {
    // The client loads the list itself.
  }

  if (events.length === 0) return <>{children}</>;

  const itemList = {
    "@type": "ItemList",
    itemListElement: events.map((event, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/e/${event.slug || event.id}`),
      name: event.title ?? undefined,
    })),
  };

  return (
    <SWRConfig value={{ fallback: { [key]: { events } } }}>
      <JsonLd data={itemList} />
      {children}
    </SWRConfig>
  );
}

import { eq, or } from "drizzle-orm";
import type { Metadata } from "next";
import EventDetailPage from "@/app/(app)/(events)/events/[id]/page";
import { getDb } from "@/db";
import { events } from "@/db/schema";
import { buildMetadata } from "@/lib/seo";

interface EventShortLinkProps {
  params: Promise<{ id: string }>;
}

function shortDescription(text: string | null | undefined, fallback: string) {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  return clean.length > 160 ? `${clean.slice(0, 157).trimEnd()}…` : clean;
}

export async function generateMetadata({ params }: EventShortLinkProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const event = await getDb().query.events.findFirst({
      where: or(eq(events.id, id), eq(events.slug, id)),
      with: { institution: true },
    });

    if (event) {
      const where = event.institution?.name ? ` at ${event.institution.name.split(",")[0]}` : "";
      return buildMetadata({
        title: event.title,
        description: shortDescription(
          event.description,
          `${event.title}${where}. See the date, venue and how to join.`
        ),
        path: `/e/${id}`,
        image: event.bannerUrl ?? undefined,
      });
    }
  } catch {
    // Fall through to the generic event metadata below.
  }

  return buildMetadata({
    title: "Event",
    description: "See the date, venue and how to join this college event on CampusLoop.",
    path: `/e/${id}`,
    noindex: true,
  });
}

/**
 * Public event page. Outside the auth-gated `(main)` layout so a QR scan or a
 * shared link opens the event itself; registering still requires an account.
 */
export default EventDetailPage;

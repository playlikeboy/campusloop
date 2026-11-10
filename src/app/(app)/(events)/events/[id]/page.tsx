import { eq, or } from "drizzle-orm";
import type { Metadata } from "next";
import { getDb } from "@/db";
import { events } from "@/db/schema";
import { breadcrumbJsonLd, buildMetadata, eventJsonLd } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { EventDetailClient } from "./event-detail-client";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

async function findEvent(id: string) {
  const db = getDb();
  return db.query.events.findFirst({
    where: or(eq(events.id, id), eq(events.slug, id)),
    with: { institution: true },
  });
}

/** Drafts, unlisted and college-only events stay out of search. */
function isPublicEvent(event: { status: string | null; visibility: string | null }) {
  return event.status !== "DRAFT" && (event.visibility ?? "PUBLIC") === "PUBLIC";
}

function shortDescription(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 158 ? `${clean.slice(0, 155).trimEnd()}...` : clean;
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  try {
    const { id } = await params;
    const event = await findEvent(id);
    if (!event) return { title: "Event not found", robots: { index: false, follow: false } };

    const key = event.slug || event.id;
    const place = event.institution?.name ? ` at ${event.institution.name}` : "";
    const description = shortDescription(
      event.tagline ||
        event.description ||
        `${event.title} by ${event.clubName}${place}. See the date, venue and how to register.`
    );

    return buildMetadata({
      title: event.title,
      description,
      path: `/e/${key}`,
      image: event.bannerUrl?.startsWith("https://") ? event.bannerUrl : undefined,
      keywords: [event.title, event.clubName, event.institution?.name ?? "college event"].filter(Boolean),
      noindex: !isPublicEvent(event),
    });
  } catch {
    return { title: "Event" };
  }
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  let jsonLd = null;

  try {
    const event = await findEvent(id);
    if (event?.startDate && isPublicEvent(event)) {
      const path = `/e/${event.slug || event.id}`;
      const mode = event.mode || "OFFLINE";
      const venueName = event.venue || event.institution?.name;
      const fee = Number.parseFloat((event.entryFee ?? "").replace(/[^\d.]/g, ""));
      jsonLd = [
        breadcrumbJsonLd([
          { name: "Events", path: "/events" },
          { name: event.title, path },
        ]),
        eventJsonLd({
          name: event.title,
          description: event.description ? event.description.slice(0, 500) : event.tagline,
          path,
          startDate: new Date(event.startDate),
          endDate: event.endDate ? new Date(event.endDate) : null,
          image: event.bannerUrl?.startsWith("https://") ? event.bannerUrl : null,
          venue:
            mode !== "ONLINE" && venueName
              ? { name: venueName, address: event.institution?.name ?? null }
              : null,
          online: mode === "ONLINE" || mode === "HYBRID",
          organizerName: event.clubName,
          status: event.status === "CANCELLED" ? "cancelled" : "scheduled",
          price: event.isPaid ? (Number.isFinite(fee) ? fee : null) : 0,
        }),
      ];
    }
  } catch {}

  return (
    <>
      {jsonLd && <JsonLd data={jsonLd} />}
      <EventDetailClient eventId={id} />
    </>
  );
}

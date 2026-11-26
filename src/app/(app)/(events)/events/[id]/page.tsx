import { and, desc, eq, ne, or, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { getDb } from "@/db";
import { eventRegistrations, events } from "@/db/schema";
import { breadcrumbJsonLd, buildMetadata, eventJsonLd } from "@/lib/seo";
import { fitDescription, fitTitle } from "@/lib/seo/describe";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { EventDetailClient } from "./event-detail-client";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

async function findEvent(id: string) {
  const db = getDb();
  return db.query.events.findFirst({
    where: or(eq(events.id, id), eq(events.slug, id)),
    with: {
      organizer: { columns: { id: true, username: true, displayName: true, avatarUrl: true } },
      institution: {
        columns: { id: true, name: true, slug: true, logoUrl: true, district: true, state: true },
      },
    },
  });
}

type EventRow = NonNullable<Awaited<ReturnType<typeof findEvent>>>;

/**
 * Only published, public events are indexed and rendered on the server.
 * Drafts, cancelled, unlisted and college-only events load in the browser
 * through the API, which checks who is asking.
 */
function isPublicEvent(event: { status: string | null; visibility: string | null }) {
  return event.status === "PUBLISHED" && (event.visibility ?? "PUBLIC") === "PUBLIC";
}

function eventDateLabel(date: Date | string | null | undefined) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

function shortCollegeName(name: string | null | undefined) {
  return name ? name.split(",")[0].trim() : null;
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  try {
    const { id } = await params;
    const event = await findEvent(id);
    if (!event) return { title: "Event not found", robots: { index: false, follow: false } };

    const key = event.slug || event.id;
    const college = shortCollegeName(event.institution?.name);
    const date = eventDateLabel(event.startDate);
    const where = event.mode === "ONLINE" ? "Online" : event.venue || college;
    const description = fitDescription(event.tagline || event.description, [
      date && where ? `${date}, ${where}` : date || where,
      event.clubName && `Hosted by ${event.clubName}${college ? ` at ${college}` : ""}`,
      event.isPaid ? `Entry: ${event.entryFee || "paid"}` : "Free to join",
      "See the date, venue and how to register on CampusLoop",
    ]);

    return buildMetadata({
      title: fitTitle(event.title),
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

/** Same payload as GET /api/events/[id] for a signed-out viewer. */
async function publicEventPayload(event: EventRow) {
  const db = getDb();
  const [countRow] = await db
    .select({
      attendeeCount: sql<number>`COALESCE(SUM(
        CASE
          WHEN ${eventRegistrations.registrationType} = 'TEAM'
          THEN 1 + COALESCE(jsonb_array_length(
            CASE WHEN jsonb_typeof(${eventRegistrations.teamMembers}) = 'array'
                 THEN ${eventRegistrations.teamMembers}
                 ELSE '[]'::jsonb
            END
          ), 0)
          ELSE 1
        END
      ), 0)::int`,
    })
    .from(eventRegistrations)
    .where(and(eq(eventRegistrations.eventId, event.id), ne(eventRegistrations.status, "CANCELLED")));

  return {
    ...event,
    attendeeCount: Number(countRow?.attendeeCount ?? 0),
    isRegistered: false,
    userRegistration: null,
    reminderSet: false,
  };
}

/** Same shape as GET /api/events/[id]/related for a signed-out viewer. */
async function publicRelatedEvents(event: EventRow) {
  const rows = await getDb().query.events.findMany({
    where: and(
      ne(events.id, event.id),
      eq(events.status, "PUBLISHED"),
      eq(events.visibility, "PUBLIC"),
      or(eq(events.eventType, event.eventType), eq(events.institutionId, event.institutionId))
    ),
    orderBy: [desc(events.startDate)],
    limit: 4,
    with: {
      organizer: { columns: { id: true, username: true, displayName: true, avatarUrl: true } },
      institution: { columns: { id: true, name: true, slug: true } },
      registrations: { columns: { id: true } },
    },
  });
  return rows.map((ev) => ({
    id: ev.id,
    slug: ev.slug,
    title: ev.title,
    tagline: ev.tagline,
    bannerUrl: ev.bannerUrl,
    clubName: ev.clubName,
    institution: ev.institution,
    eventType: ev.eventType,
    mode: ev.mode,
    venue: ev.venue,
    startDate: ev.startDate,
    endDate: ev.endDate,
    registrationDeadline: ev.registrationDeadline,
    prizesDescription: ev.prizesDescription,
    entryFee: ev.entryFee,
    loopPointsReward: ev.loopPointsReward,
    attendeeCount: ev.registrations.length,
  }));
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  let jsonLd = null;
  let initialEvent: unknown;
  let initialRelated: unknown[] | undefined;

  try {
    const event = await findEvent(id);
    if (event && isPublicEvent(event)) {
      const [payload, related] = await Promise.all([publicEventPayload(event), publicRelatedEvents(event)]);
      // JSON round trip so the client gets exactly what the API would send (dates as strings).
      initialEvent = JSON.parse(JSON.stringify(payload));
      initialRelated = JSON.parse(JSON.stringify(related));
    }
    if (event?.startDate && isPublicEvent(event)) {
      const path = `/e/${event.slug || event.id}`;
      const mode = event.mode || "OFFLINE";
      const college = event.institution;
      const venueName = event.venue || college?.name;
      const fee = Number.parseFloat((event.entryFee ?? "").replace(/[^\d.]/g, ""));
      jsonLd = [
        breadcrumbJsonLd([
          { name: "Events", path: "/events" },
          ...(college?.slug ? [{ name: shortCollegeName(college.name) ?? college.name, path: `/college/${college.slug}` }] : []),
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
              ? {
                  name: venueName,
                  address: college?.name ?? null,
                  locality: college?.district ?? null,
                  region: college?.state ?? null,
                }
              : null,
          online: mode === "ONLINE" || mode === "HYBRID",
          organizerName: event.clubName,
          status: "scheduled",
          price: event.isPaid ? (Number.isFinite(fee) ? fee : null) : 0,
        }),
      ];
    }
  } catch {}

  return (
    <>
      {jsonLd && <JsonLd data={jsonLd} />}
      <EventDetailClient eventId={id} initialEvent={initialEvent} initialRelated={initialRelated} />
    </>
  );
}

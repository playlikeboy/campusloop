import { and, desc, eq, ne, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { eventRegistrations, events, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();

    // Authenticated user session
    let currentProfile = null;
    try {
      const user = await hexclaveServerApp.getUser();
      if (user?.id) {
        currentProfile = await db.query.userProfiles.findFirst({
          where: eq(userProfiles.userId, user.id),
        });
      }
    } catch {
      // Guest viewer
    }

    // Do NOT eagerly load all registrations or attendee profiles in event detail GET
    const event = await db.query.events.findFirst({
      where: or(eq(events.id, id), eq(events.slug, id)),
      with: {
        organizer: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        institution: {
          columns: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Drafts are private to the organizer and admins; unlisted events are
    // reachable by direct link but never surfaced in general discovery.
    const isOrganizer = Boolean(currentProfile && event.organizerProfileId === currentProfile.id);
    const isAdmin = currentProfile?.role === "ADMIN";
    if (event.status !== "PUBLISHED" && !isOrganizer && !isAdmin) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check visibility authorization
    if (event.visibility === "UNLISTED" && !isOrganizer && !isAdmin) {
      // Unlisted events are allowed through a direct link, not as public listings.
    }
    if (event.visibility === "PRIVATE") {
      const isOrganizer = currentProfile && event.organizerProfileId === currentProfile.id;
      const isSameCampus = currentProfile && event.institutionId === currentProfile.institutionId;
      const isAdmin = currentProfile?.role === "ADMIN";
      if (!isOrganizer && !isSameCampus && !isAdmin) {
        return NextResponse.json(
          { error: "This event is private to the host campus community." },
          { status: 403 }
        );
      }
    }

    // Use SQL COUNT/SUM to calculate attendee count efficiently without loading attendee data
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
      .where(
        and(
          eq(eventRegistrations.eventId, event.id),
          ne(eventRegistrations.status, "CANCELLED")
        )
      );

    const attendeeCount = Number(countRow?.attendeeCount ?? 0);

    // Only load the current viewer's own registration (if authenticated)
    let userRegistration = null;
    let isRegistered = false;
    if (currentProfile) {
      userRegistration = await db.query.eventRegistrations.findFirst({
        where: and(
          eq(eventRegistrations.eventId, event.id),
          eq(eventRegistrations.profileId, currentProfile.id),
          ne(eventRegistrations.status, "CANCELLED")
        ),
      });
      isRegistered = !!userRegistration;
    }

    // Check if authorized organizer/admin is explicitly requesting the management attendees list
    const isOrganizerOrAdmin = Boolean(
      currentProfile && (event.organizerProfileId === currentProfile.id || currentProfile.role === "ADMIN")
    );
    const url = new URL(req.url, "http://localhost");
    const referer = req.headers.get("referer") || "";
    const isManageRequest =
      isOrganizerOrAdmin &&
      (url.searchParams.get("manage") === "true" ||
       url.searchParams.get("includeRegistrations") === "true" ||
       referer.includes("/events/manage/"));

    let managedRegistrations: any[] | undefined = undefined;
    if (isManageRequest) {
      managedRegistrations = await db.query.eventRegistrations.findMany({
        where: eq(eventRegistrations.eventId, event.id),
        orderBy: [desc(eventRegistrations.createdAt)],
        with: {
          profile: {
            columns: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              course: true,
              branch: true,
              year: true,
              email: true,
            },
            with: {
              institution: {
                columns: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    }

    // Public event detail response NEVER exposes attendee phone numbers, emails, notes, or private team info
    return NextResponse.json({
      event: {
        ...event,
        attendeeCount,
        isRegistered,
        userRegistration: userRegistration || null,
        reminderSet: userRegistration?.reminderSet ?? false,
        ...(managedRegistrations ? { registrations: managedRegistrations } : {}),
      },
    });
  } catch (error) {
    console.error("GET /api/events/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await hexclaveServerApp.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const event = await db.query.events.findFirst({
      where: or(eq(events.id, id), eq(events.slug, id)),
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Only organizer or Admin can delete
    if (event.organizerProfileId !== profile.id && profile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(events).where(eq(events.id, event.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/events/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await hexclaveServerApp.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const event = await db.query.events.findFirst({
      where: or(eq(events.id, id), eq(events.slug, id)),
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Only organizer or Admin can update
    if (event.organizerProfileId !== profile.id && profile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = ((await req.json().catch(() => ({}))) || {}) as Record<string, any>;

    const [updatedEvent] = await db
      .update(events)
      .set({
        title: body.title !== undefined ? body.title : event.title,
        tagline: body.tagline !== undefined ? body.tagline : event.tagline,
        description: body.description !== undefined ? body.description : event.description,
        bannerUrl: body.bannerUrl !== undefined ? body.bannerUrl : event.bannerUrl,
        clubName: body.clubName !== undefined ? body.clubName : event.clubName,
        venue: body.venue !== undefined ? body.venue : event.venue,
        meetingUrl: body.meetingUrl !== undefined ? body.meetingUrl : event.meetingUrl,
        mode: body.mode !== undefined ? body.mode : event.mode,
        eventType: body.eventType !== undefined ? body.eventType : event.eventType,
        startDate: body.startDate ? new Date(body.startDate) : event.startDate,
        endDate: body.endDate ? new Date(body.endDate) : event.endDate,
        registrationDeadline: body.registrationDeadline
          ? new Date(body.registrationDeadline)
          : event.registrationDeadline,
        maxParticipants: body.maxParticipants !== undefined ? body.maxParticipants : event.maxParticipants,
        prizesDescription:
          body.prizesDescription !== undefined ? body.prizesDescription : event.prizesDescription,
        status: body.status !== undefined ? body.status : event.status,
        visibility: body.visibility !== undefined ? body.visibility : event.visibility,
        updatedAt: new Date(),
      })
      .where(eq(events.id, event.id))
      .returning();

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error("PATCH /api/events/[id] error:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

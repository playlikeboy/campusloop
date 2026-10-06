import { desc, eq, or } from "drizzle-orm";
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
        registrations: {
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
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check visibility authorization
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

    const isRegistered = currentProfile
      ? event.registrations.some((r) => r.profileId === currentProfile.id)
      : false;
    const userReg = currentProfile
      ? event.registrations.find((r) => r.profileId === currentProfile.id)
      : null;

    return NextResponse.json({
      event: {
        ...event,
        attendeeCount: event.registrations.length,
        isRegistered,
        userRegistration: userReg,
        reminderSet: userReg?.reminderSet ?? false,
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

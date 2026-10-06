import { eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { eventRegistrations, events, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
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
      with: {
        registrations: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organizerProfileId !== profile.id && profile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, message } = body as { title?: string; message?: string };

    if (!message?.trim()) {
      return NextResponse.json({ error: "Broadcast message cannot be empty" }, { status: 400 });
    }

    const preview = `[${event.title}] ${title ? `${title}: ` : ""}${message.trim()}`.slice(0, 180);

    // Concurrently dispatch notifications to all registered attendees
    const promises = event.registrations
      .filter((r) => r.profileId !== profile.id && r.status !== "CANCELLED")
      .map((r) =>
        createNotification({
          userId: r.profileId,
          actorId: profile.id,
          type: "EVENT_REGISTRATION",
          referenceId: event.id,
          previewText: preview,
        }).catch(() => {})
      );

    await Promise.all(promises);

    return NextResponse.json({
      success: true,
      dispatchedCount: promises.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("POST /api/events/[id]/broadcast error:", error);
    return NextResponse.json({ error: "Failed to broadcast update" }, { status: 500 });
  }
}

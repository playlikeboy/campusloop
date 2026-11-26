import { randomUUID } from "node:crypto";
import { and, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";

const nanoid = (len = 12) => randomUUID().replace(/-/g, "").slice(0, len);

import { getDb } from "@/db";
import { eventRegistrations, events, userProfiles } from "@/db/schema";
import { getCachedAuthUser } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCachedAuthUser();
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

    const reg = await db.query.eventRegistrations.findFirst({
      where: and(eq(eventRegistrations.eventId, event.id), eq(eventRegistrations.profileId, profile.id)),
    });

    if (!reg) {
      // Reminders ride on a registration. Creating one here would skip every check in
      // /register (capacity, deadline, event status, campus-only events), so register first.
      return NextResponse.json({ error: "Register for this event first to set a reminder." }, { status: 409 });
    }

    const nextState = !reg.reminderSet;
    await db
      .update(eventRegistrations)
      .set({ reminderSet: nextState })
      .where(eq(eventRegistrations.id, reg.id));

    return NextResponse.json({ reminderSet: nextState });
  } catch (error) {
    console.error("POST /api/events/[id]/reminder error:", error);
    return NextResponse.json({ error: "Failed to toggle reminder" }, { status: 500 });
  }
}

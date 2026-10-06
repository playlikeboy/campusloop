import { eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { eventRegistrations, events, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string; regId: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id, regId } = await params;
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

    // Only organizer or Admin can update registration status
    if (event.organizerProfileId !== profile.id && profile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { status } = body as { status?: string };

    if (!status || !["CONFIRMED", "WAITLISTED", "ATTENDED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const [updated] = await db
      .update(eventRegistrations)
      .set({ status })
      .where(eq(eventRegistrations.id, regId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, registration: updated });
  } catch (error) {
    console.error("PATCH /api/events/[id]/registrations/[regId] error:", error);
    return NextResponse.json({ error: "Failed to update registration status" }, { status: 500 });
  }
}

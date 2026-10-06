import { randomUUID } from "node:crypto";
import { and, eq, ne, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

const nanoid = (len = 12) => randomUUID().replace(/-/g, "").slice(0, len);

import { getDb } from "@/db";
import { eventRegistrations, events, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { rejectIfLacksCapability } from "@/lib/capabilities";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await hexclaveServerApp.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
      with: {
        institution: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Capability check: Must be able to participate
    const guardResponse = await rejectIfLacksCapability(profile, "CREATE_POST");
    if (guardResponse) return guardResponse;

    const event = await db.query.events.findFirst({
      where: or(eq(events.id, id), eq(events.slug, id)),
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 1. Check event status
    if (event.status === "CANCELLED") {
      return NextResponse.json({ error: "This event has been cancelled." }, { status: 400 });
    }
    if (event.status === "COMPLETED") {
      return NextResponse.json({ error: "This event has already ended." }, { status: 400 });
    }
    if (event.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Registration is not open for this event." }, { status: 400 });
    }

    // 2. Check registration deadline and start date
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return NextResponse.json({ error: "Registration deadline for this event has passed" }, { status: 400 });
    }
    if (event.startDate && new Date() > new Date(event.startDate)) {
      return NextResponse.json({ error: "This event has already started" }, { status: 400 });
    }

    // 3. Check campus eligibility
    const eligibleIds = (event.eligibleInstitutionIds as string[]) || ["ALL"];
    const isOpenToAll = eligibleIds.includes("ALL");
    if (!isOpenToAll && !eligibleIds.includes(profile.institutionId)) {
      return NextResponse.json(
        {
          error:
            "This event is restricted to specific college students. Your campus is not in the eligible list.",
        },
        { status: 403 }
      );
    }

    // 4. Check if already registered (uniqueness check)
    const existing = await db.query.eventRegistrations.findFirst({
      where: and(
        eq(eventRegistrations.eventId, event.id),
        eq(eventRegistrations.profileId, profile.id),
        ne(eventRegistrations.status, "CANCELLED")
      ),
    });

    if (existing) {
      return NextResponse.json({
        message: "Already registered",
        registration: existing,
      });
    }

    const body = ((await req.json().catch(() => ({}))) || {}) as Record<string, any>;
    const { registrationType = "SOLO", teamName, teamMembers, contactPhone, notes } = body;
    const isTeam = registrationType === "TEAM";

    // Validate participation type
    if (event.participationType === "SOLO" && isTeam) {
      return NextResponse.json({ error: "This event only permits Solo registrations." }, { status: 400 });
    }
    if (event.participationType === "TEAM" && !isTeam) {
      return NextResponse.json(
        {
          error: `This event requires a team registration (${event.minTeamSize || 2} to ${event.maxTeamSize || 4} members).`,
        },
        { status: 400 }
      );
    }

    const teamMembersList = Array.isArray(teamMembers) ? teamMembers : [];
    // Requested participants: 1 for SOLO, 1 (leader) + teamMembers.length for TEAM
    const requestedParticipants = isTeam ? 1 + teamMembersList.length : 1;

    if (isTeam) {
      if (!teamName || !teamName.trim()) {
        return NextResponse.json({ error: "Please provide a team name." }, { status: 400 });
      }
      const min = event.minTeamSize || 1;
      const max = event.maxTeamSize || 4;
      if (requestedParticipants < min) {
        return NextResponse.json(
          { error: `Team must have at least ${min} members (including leader). Current: ${requestedParticipants}` },
          { status: 400 }
        );
      }
      if (requestedParticipants > max) {
        return NextResponse.json(
          { error: `Team cannot exceed ${max} members. Current: ${requestedParticipants}` },
          { status: 400 }
        );
      }
    }

    // 5. Server-side Capacity Enforcement
    // Count actual participants (1 for SOLO, 1 + teamMembers.length for TEAM) across active registrations
    const [countResult] = await db
      .select({
        currentParticipants: sql<number>`COALESCE(SUM(
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

    const currentParticipants = Number(countResult?.currentParticipants ?? 0);

    if (event.maxParticipants && event.maxParticipants > 0) {
      if (currentParticipants + requestedParticipants > event.maxParticipants) {
        const spotsRemaining = Math.max(0, event.maxParticipants - currentParticipants);
        return NextResponse.json(
          {
            error:
              spotsRemaining === 0
                ? "This event has reached full capacity."
                : `Not enough spots remaining. Only ${spotsRemaining} spot(s) left, but your registration requested ${requestedParticipants}.`,
            code: "CAPACITY_EXCEEDED",
            currentParticipants,
            maxParticipants: event.maxParticipants,
            spotsRemaining,
          },
          { status: 409 }
        );
      }
    }

    const regId = `ereg_${nanoid(12)}`;
    const newReg = {
      id: regId,
      eventId: event.id,
      profileId: profile.id,
      registrationType: isTeam ? "TEAM" : "SOLO",
      teamName: isTeam ? teamName?.trim() || "Team" : null,
      teamMembers: teamMembersList,
      contactPhone: contactPhone?.trim() || null,
      notes: notes?.trim() || null,
      status: "CONFIRMED",
      reminderSet: true,
    };

    // 6. Concurrency-safe insertion
    if (event.maxParticipants && event.maxParticipants > 0) {
      const teamMembersJson = JSON.stringify(teamMembersList);
      const insertResult = (await db.execute(sql`
        INSERT INTO event_registrations (
          id, event_id, profile_id, registration_type, team_name, team_members, contact_phone, notes, status, reminder_set, created_at
        )
        SELECT
          ${regId},
          ${event.id},
          ${profile.id},
          ${isTeam ? "TEAM" : "SOLO"},
          ${isTeam ? teamName?.trim() || "Team" : null},
          ${teamMembersJson}::jsonb,
          ${contactPhone?.trim() || null},
          ${notes?.trim() || null},
          'CONFIRMED',
          true,
          NOW()
        WHERE (
          SELECT COALESCE(SUM(
            CASE 
              WHEN registration_type = 'TEAM' 
              THEN 1 + COALESCE(jsonb_array_length(
                CASE WHEN jsonb_typeof(team_members) = 'array' 
                     THEN team_members 
                     ELSE '[]'::jsonb 
                END
              ), 0)
              ELSE 1
            END
          ), 0)
          FROM event_registrations
          WHERE event_id = ${event.id} AND status != 'CANCELLED'
        ) + ${requestedParticipants} <= ${event.maxParticipants}
        ON CONFLICT (event_id, profile_id) DO NOTHING
        RETURNING id;
      `)) as any;

      const rows = insertResult?.rows || [];
      if (rows.length === 0) {
        // Double-check if conflict was duplicate or capacity reached
        const checkDuplicate = await db.query.eventRegistrations.findFirst({
          where: and(
            eq(eventRegistrations.eventId, event.id),
            eq(eventRegistrations.profileId, profile.id),
            ne(eventRegistrations.status, "CANCELLED")
          ),
        });
        if (checkDuplicate) {
          return NextResponse.json({
            message: "Already registered",
            registration: checkDuplicate,
          });
        }

        return NextResponse.json(
          {
            error: "This event has reached full capacity.",
            code: "CAPACITY_EXCEEDED",
          },
          { status: 409 }
        );
      }
    } else {
      // Unlimited capacity
      const [inserted] = await db
        .insert(eventRegistrations)
        .values(newReg)
        .onConflictDoNothing()
        .returning();

      if (!inserted) {
        const checkDuplicate = await db.query.eventRegistrations.findFirst({
          where: and(
            eq(eventRegistrations.eventId, event.id),
            eq(eventRegistrations.profileId, profile.id),
            ne(eventRegistrations.status, "CANCELLED")
          ),
        });
        return NextResponse.json({
          message: "Already registered",
          registration: checkDuplicate,
        });
      }
    }

    // Award Loop Points for registering
    try {
      const reward = event.loopPointsReward || 25;
      await db
        .update(userProfiles)
        .set({ points: sql`${userProfiles.points} + ${reward}` })
        .where(eq(userProfiles.id, profile.id));
    } catch {
      // Non-blocking
    }

    // Create confirmation notification
    await createNotification({
      userId: profile.id,
      actorId: event.organizerProfileId,
      type: "EVENT_REGISTRATION",
      referenceId: event.id,
      previewText: `You are officially registered for ${event.title} organized by ${event.clubName}!`,
      silent: true,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Successfully registered for event!",
      registration: newReg,
      pointsEarned: event.loopPointsReward || 25,
    });
  } catch (error) {
    console.error("POST /api/events/[id]/register error:", error);
    return NextResponse.json({ error: "Failed to register for event" }, { status: 500 });
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

    await db
      .delete(eventRegistrations)
      .where(and(eq(eventRegistrations.eventId, event.id), eq(eventRegistrations.profileId, profile.id)));

    return NextResponse.json({ success: true, message: "Registration cancelled" });
  } catch (error) {
    console.error("DELETE /api/events/[id]/register error:", error);
    return NextResponse.json({ error: "Failed to cancel registration" }, { status: 500 });
  }
}

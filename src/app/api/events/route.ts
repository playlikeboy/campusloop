import { randomUUID } from "node:crypto";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { NextResponse } from "next/server";

const nanoid = (len = 12) => randomUUID().replace(/-/g, "").slice(0, len);

import { getDb } from "@/db";
import { events, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { rejectIfLacksCapability } from "@/lib/capabilities";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "ALL";
    const scope = searchParams.get("scope") || "ALL"; // 'MY_CAMPUS' | 'ALL'
    const mode = searchParams.get("mode") || "ALL"; // 'ONLINE' | 'OFFLINE' | 'HYBRID' | 'ALL'
    const statusFilter = searchParams.get("status") || "ALL"; // 'LIVE' | 'CLOSING_SOON' | 'UPCOMING' | 'CLOSED' | 'ALL'
    const participationType = searchParams.get("participationType") || "ALL"; // 'SOLO' | 'TEAM' | 'ALL'
    const feeFilter = searchParams.get("fee") || "ALL"; // 'FREE' | 'PAID' | 'ALL'
    const hasPrizes = searchParams.get("hasPrizes") === "true";
    const query = searchParams.get("q") || "";
    const sort = searchParams.get("sort") || "trending"; // 'trending' | 'closing_soon' | 'highest_prize' | 'upcoming' | 'latest'

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

    const conditions = [];

    // Category filter with Unstop-grade type mapping
    if (category !== "ALL") {
      const typeMap: Record<string, string[]> = {
        hackathon: ["HACKATHON"],
        hackathons: ["HACKATHON"],
        coding: ["HACKATHON"],
        quiz: ["COMPETITION"],
        quizzes: ["COMPETITION"],
        fest: ["FEST", "CULTURAL"],
        fests: ["FEST", "CULTURAL"],
        cultural: ["CULTURAL", "FEST"],
        workshop: ["WORKSHOP"],
        workshops: ["WORKSHOP"],
        bootcamp: ["WORKSHOP"],
        competition: ["COMPETITION"],
        competitions: ["COMPETITION"],
        "case-study": ["COMPETITION"],
        seminar: ["SEMINAR"],
        seminars: ["SEMINAR"],
        conference: ["SEMINAR"],
        conferences: ["SEMINAR"],
        hiring: ["COMPETITION", "HACKATHON"],
        sports: ["SPORTS"],
        meetup: ["MEETUP"],
      };

      const mapped = typeMap[category.toLowerCase()] || [category.toUpperCase()];
      if (mapped.length === 1) {
        conditions.push(eq(events.eventType, mapped[0]));
      } else {
        conditions.push(or(...mapped.map((t) => eq(events.eventType, t))));
      }
    }

    // Mode filter
    if (mode !== "ALL") {
      if (mode === "ONLINE") {
        conditions.push(eq(events.mode, "ONLINE"));
      } else if (mode === "OFFLINE") {
        conditions.push(or(eq(events.mode, "OFFLINE"), eq(events.mode, "IN_PERSON")));
      } else if (mode === "HYBRID") {
        conditions.push(eq(events.mode, "HYBRID"));
      }
    }

    // Participation Type filter
    if (participationType !== "ALL") {
      if (participationType === "SOLO") {
        conditions.push(or(eq(events.participationType, "SOLO"), eq(events.participationType, "BOTH")));
      } else if (participationType === "TEAM") {
        conditions.push(or(eq(events.participationType, "TEAM"), eq(events.participationType, "BOTH")));
      }
    }

    // Fee filter
    if (feeFilter !== "ALL") {
      if (feeFilter === "FREE") {
        conditions.push(or(eq(events.isPaid, false), ilike(events.entryFee, "%free%")));
      } else if (feeFilter === "PAID") {
        conditions.push(eq(events.isPaid, true));
      }
    }

    // Campus scope filter
    if (scope === "HOSTED" || scope === "ORGANIZED" || scope === "MY_EVENTS") {
      if (!currentProfile) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      conditions.push(eq(events.organizerProfileId, currentProfile.id));
    } else if (scope === "MY_CAMPUS" && currentProfile?.institutionId) {
      conditions.push(eq(events.institutionId, currentProfile.institutionId));
    }

    // Search query
    if (query.trim()) {
      const pattern = `%${query.trim()}%`;
      conditions.push(
        or(
          ilike(events.title, pattern),
          ilike(events.clubName, pattern),
          ilike(events.description, pattern),
          ilike(events.venue, pattern),
          ilike(events.tagline, pattern)
        )
      );
    }

    // Visibility filter:
    // 1. If viewing own hosted events, don't restrict visibility
    // 2. Never show UNLISTED events in the general listing/search unless specifically invited
    // 3. PRIVATE events only shown if user is from the same institution or is organizer
    if (scope !== "HOSTED" && scope !== "ORGANIZED" && scope !== "MY_EVENTS") {
      if (currentProfile?.institutionId) {
        conditions.push(
          or(
            eq(events.visibility, "PUBLIC"),
            and(eq(events.visibility, "PRIVATE"), eq(events.institutionId, currentProfile.institutionId)),
            eq(events.organizerProfileId, currentProfile.id)
          )
        );
      } else {
        // Unauthenticated / guest only sees PUBLIC
        conditions.push(eq(events.visibility, "PUBLIC"));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const list = await db.query.events.findMany({
      where: whereClause,
      orderBy: [desc(events.startDate)],
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
          columns: {
            id: true,
            profileId: true,
            reminderSet: true,
            status: true,
            registrationType: true,
            teamName: true,
            teamMembers: true,
            contactPhone: true,
            createdAt: true,
          },
          with: {
            profile: {
              columns: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const now = Date.now();

    let enriched = list.map((ev) => {
      const isRegistered = currentProfile
        ? ev.registrations.some((r) => r.profileId === currentProfile.id)
        : false;
      const userReg = currentProfile ? ev.registrations.find((r) => r.profileId === currentProfile.id) : null;

      const startMs = new Date(ev.startDate).getTime();
      const endMs = new Date(ev.endDate).getTime();
      const deadlineMs = ev.registrationDeadline ? new Date(ev.registrationDeadline).getTime() : null;

      const isLiveNow = now >= startMs && now <= endMs;
      const isClosed = ev.status === "COMPLETED" || ev.status === "CANCELLED" || now > endMs;
      const isClosingSoon =
        !isClosed && deadlineMs !== null && deadlineMs > now && deadlineMs - now <= 3 * 24 * 60 * 60 * 1000;

      return {
        id: ev.id,
        slug: ev.slug,
        title: ev.title,
        tagline: ev.tagline,
        description: ev.description,
        bannerUrl: ev.bannerUrl,
        clubName: ev.clubName,
        organizer: ev.organizer,
        institution: ev.institution,
        eligibleInstitutionIds: ev.eligibleInstitutionIds,
        eventType: ev.eventType,
        mode: ev.mode,
        venue: ev.venue,
        meetingUrl: ev.meetingUrl,
        startDate: ev.startDate,
        endDate: ev.endDate,
        registrationDeadline: ev.registrationDeadline,
        participationType: ev.participationType,
        minTeamSize: ev.minTeamSize,
        maxTeamSize: ev.maxTeamSize,
        maxParticipants: ev.maxParticipants,
        isPaid: ev.isPaid,
        entryFee: ev.entryFee,
        prizesDescription: ev.prizesDescription,
        perks: ev.perks,
        loopPointsReward: ev.loopPointsReward,
        status: ev.status,
        attendeeCount: ev.registrations.length,
        attendedCount: ev.registrations.filter((r: any) => r.status === "ATTENDED").length,
        confirmedCount: ev.registrations.filter((r: any) => r.status === "CONFIRMED" || r.status === "ATTENDED").length,
        recentAttendees: ev.registrations
          .slice(0, 4)
          .map((r: any) => r.profile)
          .filter(Boolean),
        isRegistered,
        userRegistration: userReg,
        reminderSet: userReg?.reminderSet ?? false,
        isLiveNow,
        isClosingSoon,
        isClosed,
        createdAt: ev.createdAt,
      };
    });

    // If scope is REGISTERED, filter to user registered events only
    if (scope === "REGISTERED") {
      enriched = enriched.filter((e) => e.isRegistered);
    }

    // Compute platform-level Unstop metrics across all accessible events
    const totalOpportunities = enriched.length;
    const liveHackathons = enriched.filter((e) => e.eventType === "HACKATHON" && !e.isClosed).length;
    const cashPrizeCount = enriched.filter((e) => Boolean(e.prizesDescription) && !e.isClosed).length;
    const totalRegistrations = enriched.reduce((acc, e) => acc + (e.attendeeCount || 0), 0);

    // Apply Status Filter if specified
    if (statusFilter !== "ALL") {
      if (statusFilter === "LIVE") {
        enriched = enriched.filter((e) => e.isLiveNow);
      } else if (statusFilter === "CLOSING_SOON") {
        enriched = enriched.filter((e) => e.isClosingSoon);
      } else if (statusFilter === "UPCOMING") {
        enriched = enriched.filter((e) => !e.isClosed && !e.isLiveNow);
      } else if (statusFilter === "CLOSED") {
        enriched = enriched.filter((e) => e.isClosed);
      }
    }

    // Apply Has Prizes filter
    if (hasPrizes) {
      enriched = enriched.filter((e) => Boolean(e.prizesDescription));
    }

    // Sorting
    if (sort === "trending") {
      enriched.sort((a, b) => {
        const regScoreA = Math.log10(1 + (a.attendeeCount || 0)) * 4.0;
        const regScoreB = Math.log10(1 + (b.attendeeCount || 0)) * 4.0;

        const startDiffDaysA = Math.max(0, (new Date(a.startDate).getTime() - now) / (1000 * 60 * 60 * 24));
        const startDiffDaysB = Math.max(0, (new Date(b.startDate).getTime() - now) / (1000 * 60 * 60 * 24));

        const urgencyA = startDiffDaysA <= 14 ? ((14 - startDiffDaysA) / 14) * 3.0 : 0;
        const urgencyB = startDiffDaysB <= 14 ? ((14 - startDiffDaysB) / 14) * 3.0 : 0;

        const affinityA =
          currentProfile?.institutionId && (a.institution as any)?.id === currentProfile.institutionId
            ? 2.5
            : 0;
        const affinityB =
          currentProfile?.institutionId && (b.institution as any)?.id === currentProfile.institutionId
            ? 2.5
            : 0;

        const scoreA = regScoreA + urgencyA + affinityA;
        const scoreB = regScoreB + urgencyB + affinityB;

        return scoreB - scoreA;
      });
    } else if (sort === "closing_soon") {
      enriched.sort((a, b) => {
        const deadlineA = a.registrationDeadline ? new Date(a.registrationDeadline).getTime() : Infinity;
        const deadlineB = b.registrationDeadline ? new Date(b.registrationDeadline).getTime() : Infinity;
        return deadlineA - deadlineB;
      });
    } else if (sort === "highest_prize") {
      enriched.sort((a, b) => {
        const hasA = Boolean(a.prizesDescription);
        const hasB = Boolean(b.prizesDescription);
        if (hasA && !hasB) return -1;
        if (!hasA && hasB) return 1;
        return (b.attendeeCount || 0) - (a.attendeeCount || 0);
      });
    } else if (sort === "upcoming") {
      enriched.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    } else if (sort === "latest") {
      enriched.sort(
        (a, b) =>
          new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime()
      );
    }

    return NextResponse.json({
      events: enriched,
      metrics: {
        totalOpportunities,
        liveHackathons,
        cashPrizeCount,
        totalPrizePool: "₹15,00,000+",
        totalRegistrations,
      },
    });
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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

    // Check capability: Aspirants / Viewers cannot create events without connecting college email
    const guardResponse = await rejectIfLacksCapability(profile, "CREATE_POST");
    if (guardResponse) return guardResponse;

    const body = (await req.json()) as Record<string, any>;
    const {
      title,
      tagline,
      description,
      bannerUrl,
      clubName,
      eligibleInstitutionIds = ["ALL"],
      eventType = "HACKATHON",
      mode = "OFFLINE",
      venue,
      meetingUrl,
      startDate,
      endDate,
      registrationDeadline,
      participationType = "SOLO",
      minTeamSize = 1,
      maxTeamSize = 4,
      maxParticipants,
      isPaid = false,
      entryFee = "Free",
      prizesDescription,
      perks = ["Certificates", "Prizes", "Loop Points"],
      loopPointsReward = 30,
      status = "PUBLISHED",
      visibility = "PUBLIC",
    } = body;

    if (!title || !description || !clubName || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Title, description, club name, start date, and end date are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: "Start and end dates must be valid" }, { status: 400 });
    }

    if (end <= start) {
      return NextResponse.json({ error: "The event end time must be after its start time" }, { status: 400 });
    }

    const deadline = registrationDeadline ? new Date(registrationDeadline) : null;
    if (deadline && !Number.isNaN(deadline.getTime()) && deadline > start) {
      return NextResponse.json(
        { error: "Registrations must close on or before the event starts" },
        { status: 400 }
      );
    }

    // Only organiser-selectable states; COMPLETED/CANCELLED are lifecycle-driven.
    const safeStatus = status === "DRAFT" ? "DRAFT" : "PUBLISHED";

    const eventId = `event_${nanoid(12)}`;
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${baseSlug}-${nanoid(6)}`;

    const newEvent = {
      id: eventId,
      slug,
      title: title.trim(),
      tagline: tagline?.trim() || null,
      description: description.trim(),
      bannerUrl: bannerUrl || null,
      clubName: clubName.trim(),
      organizerProfileId: profile.id,
      institutionId: profile.institutionId,
      eligibleInstitutionIds,
      eventType,
      mode,
      venue: venue?.trim() || null,
      meetingUrl: meetingUrl?.trim() || null,
      startDate: start,
      endDate: end,
      registrationDeadline: deadline && !Number.isNaN(deadline.getTime()) ? deadline : null,
      participationType,
      minTeamSize: Number(minTeamSize) || 1,
      maxTeamSize: Number(maxTeamSize) || 4,
      maxParticipants: maxParticipants ? Number(maxParticipants) : null,
      isPaid: Boolean(isPaid),
      entryFee: entryFee || "Free",
      prizesDescription: prizesDescription?.trim() || null,
      perks: Array.isArray(perks) ? perks : ["Certificates", "Prizes", "Loop Points"],
      loopPointsReward: Number(loopPointsReward) || 30,
      status: safeStatus,
      visibility: ["PUBLIC", "UNLISTED", "PRIVATE"].includes(visibility) ? visibility : "PUBLIC",
    };

    await db.insert(events).values(newEvent);

    return NextResponse.json({ event: newEvent }, { status: 201 });
  } catch (error) {
    console.error("POST /api/events error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

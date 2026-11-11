import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, ilike, inArray, lte, or, type SQL, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

const nanoid = (len = 12) => randomUUID().replace(/-/g, "").slice(0, len);

import { getDb } from "@/db";
import { eventRegistrations, events, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { rejectIfLacksCapability } from "@/lib/capabilities";

export const dynamic = "force-dynamic";

// Upper bound for one list response when the caller does not pass `limit`.
const MAX_LIST_SIZE = 500;
// Registrant avatars returned per event for the "going" preview.
const RECENT_ATTENDEES = 4;

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
    const limitParam = searchParams.get("limit");
    const parsedLimit = limitParam ? parseInt(limitParam, 10) : NaN;
    const limit = Number.isFinite(parsedLimit) ? Math.min(MAX_LIST_SIZE, Math.max(1, parsedLimit)) : null;
    const offsetParam = parseInt(searchParams.get("offset") || "0", 10);
    const offset = Number.isFinite(offsetParam) && offsetParam > 0 ? offsetParam : 0;

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
        contest: ["CONTEST"],
        contests: ["CONTEST"],
        internship: ["INTERNSHIP"],
        internships: ["INTERNSHIP"],
        scholarship: ["SCHOLARSHIP"],
        scholarships: ["SCHOLARSHIP"],
        fellowship: ["FELLOWSHIP"],
        fellowships: ["FELLOWSHIP"],
        grant: ["GRANT"],
        grants: ["GRANT"],
        job: ["JOB"],
        jobs: ["JOB"],
        meetup: ["MEETUP"],
        meetups: ["MEETUP"],
        gaming: ["SPORTS"],
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

    // Listing privacy/lifecycle boundary:
    // - General discovery never exposes drafts or unlisted events.
    // - Organizers can still view their own drafts in the hosted/manage scope.
    // - PRIVATE events are limited to their host campus, the organizer, or an admin.
    const isOrganizerScope = ["HOSTED", "ORGANIZED", "MY_EVENTS"].includes(scope);
    if (!isOrganizerScope) {
      conditions.push(eq(events.status, "PUBLISHED"));
      if (currentProfile?.role === "ADMIN") {
        // Admins may inspect all visibility levels, but still not drafts in discovery.
      } else if (currentProfile?.institutionId) {
        conditions.push(
          or(
            eq(events.visibility, "PUBLIC"),
            and(eq(events.visibility, "PRIVATE"), eq(events.institutionId, currentProfile.institutionId)),
            eq(events.organizerProfileId, currentProfile.id)
          )
        );
      } else {
        // Guests only see published, public events.
        conditions.push(eq(events.visibility, "PUBLIC"));
      }
    }

    // Viewer-only scope: guests have no registrations, so the answer is empty.
    if (scope === "REGISTERED") {
      if (!currentProfile) {
        return NextResponse.json({
          events: [],
          metrics: {
            totalOpportunities: 0,
            liveHackathons: 0,
            cashPrizeCount: 0,
            totalPrizePool: "₹15,00,000+",
            totalRegistrations: 0,
          },
        });
      }
      conditions.push(
        sql`exists (select 1 from ${eventRegistrations} er where er.event_id = ${events.id} and er.profile_id = ${currentProfile.id})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Lifecycle state is evaluated in SQL against one fixed "now", so filtering,
    // ordering and pagination happen in the database. Timestamps are stored as
    // UTC wall-clock values, which is what an ISO string cast to timestamp gives.
    const now = Date.now();
    const nowTs = sql`${new Date(now).toISOString()}::timestamp`;
    const soonTs = sql`${new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString()}::timestamp`;
    const isClosedSql = sql`(${events.status} in ('COMPLETED', 'CANCELLED') or ${events.endDate} < ${nowTs})`;
    const isLiveSql = sql`(${events.startDate} <= ${nowTs} and ${events.endDate} >= ${nowTs})`;
    const isClosingSoonSql = sql`(not ${isClosedSql} and ${events.registrationDeadline} > ${nowTs} and ${events.registrationDeadline} <= ${soonTs})`;
    const hasPrizeSql = sql`(coalesce(${events.prizesDescription}, '') <> '')`;
    // Subqueries name the registrations table by an explicit alias: the relational
    // query builder rewrites every column reference to the root "events" alias.
    const regCountSql = sql`(select count(*) from ${eventRegistrations} er where er.event_id = ${events.id})`;

    // Platform metrics cover every accessible event, before status/prize filters.
    const metricsPromise = db
      .select({
        totalOpportunities: sql<number>`count(*)::int`,
        liveHackathons: sql<number>`(count(*) filter (where ${events.eventType} = 'HACKATHON' and not ${isClosedSql}))::int`,
        cashPrizeCount: sql<number>`(count(*) filter (where ${hasPrizeSql} and not ${isClosedSql}))::int`,
        totalRegistrations: sql<number>`coalesce(sum(${regCountSql}), 0)::int`,
      })
      .from(events)
      .where(whereClause);

    const listConditions = [...conditions];
    if (statusFilter === "ACTIVE") listConditions.push(sql`not ${isClosedSql}`);
    else if (statusFilter === "LIVE") listConditions.push(isLiveSql);
    else if (statusFilter === "CLOSING_SOON") listConditions.push(isClosingSoonSql);
    else if (statusFilter === "UPCOMING") listConditions.push(sql`(not ${isClosedSql} and not ${isLiveSql})`);
    else if (statusFilter === "CLOSED") listConditions.push(isClosedSql);
    if (hasPrizes) listConditions.push(hasPrizeSql);

    // Open events first for every named sort; ties fall back to newest start.
    const openFirst = sql`${isClosedSql} asc`;
    const newestStart = desc(events.startDate);
    let orderBy: SQL[];
    if (sort === "trending") {
      const daysUntilStart = sql`greatest(0, extract(epoch from (${events.startDate} - ${nowTs})) / 86400.0)`;
      const affinity = currentProfile?.institutionId
        ? sql`(case when ${events.institutionId} = ${currentProfile.institutionId} then 2.5 else 0 end)`
        : sql`0`;
      const score = sql`(log(1 + ${regCountSql}::float8) * 4.0 + (case when ${daysUntilStart} <= 14 then ((14 - ${daysUntilStart}) / 14.0) * 3.0 else 0 end) + ${affinity})`;
      orderBy = [openFirst, sql`${score} desc`, newestStart];
    } else if (sort === "closing_soon") {
      orderBy = [openFirst, sql`${events.registrationDeadline} asc nulls last`, newestStart];
    } else if (sort === "highest_prize") {
      orderBy = [openFirst, sql`${hasPrizeSql} desc`, sql`${regCountSql} desc`, newestStart];
    } else if (sort === "upcoming") {
      orderBy = [openFirst, asc(events.startDate)];
    } else if (sort === "latest") {
      orderBy = [openFirst, desc(events.createdAt), newestStart];
    } else {
      orderBy = [newestStart];
    }

    const listPromise = db.query.events.findMany({
      where: and(...listConditions),
      orderBy,
      limit: limit ?? MAX_LIST_SIZE,
      offset,
      extras: {
        attendeeCount: sql<number>`(select count(*)::int from ${eventRegistrations} er where er.event_id = ${events.id})`.as(
          "attendee_count"
        ),
        attendedCount: sql<number>`(select count(*)::int from ${eventRegistrations} er where er.event_id = ${events.id} and er.status = 'ATTENDED')`.as(
          "attended_count"
        ),
        confirmedCount: sql<number>`(select count(*)::int from ${eventRegistrations} er where er.event_id = ${events.id} and er.status in ('CONFIRMED', 'ATTENDED'))`.as(
          "confirmed_count"
        ),
      },
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

    const [[metricsRow], list] = await Promise.all([metricsPromise, listPromise]);
    const eventIds = list.map((ev) => ev.id);

    // Two small follow-ups scoped to the returned page: the viewer's own
    // registrations and the first few registrants per event for the avatar stack.
    const viewerRegsPromise =
      currentProfile && eventIds.length > 0
        ? db
            .select({
              id: eventRegistrations.id,
              eventId: eventRegistrations.eventId,
              profileId: eventRegistrations.profileId,
              reminderSet: eventRegistrations.reminderSet,
              status: eventRegistrations.status,
              registrationType: eventRegistrations.registrationType,
              teamName: eventRegistrations.teamName,
              teamMembers: eventRegistrations.teamMembers,
              contactPhone: eventRegistrations.contactPhone,
              createdAt: eventRegistrations.createdAt,
            })
            .from(eventRegistrations)
            .where(
              and(eq(eventRegistrations.profileId, currentProfile.id), inArray(eventRegistrations.eventId, eventIds))
            )
        : Promise.resolve([]);

    const recentPromise = (async () => {
      if (eventIds.length === 0) return [];
      const ranked = db
        .select({
          eventId: eventRegistrations.eventId,
          profileId: eventRegistrations.profileId,
          rn: sql<number>`row_number() over (partition by ${eventRegistrations.eventId} order by ${eventRegistrations.createdAt}, ${eventRegistrations.id})`.as(
            "rn"
          ),
        })
        .from(eventRegistrations)
        .where(inArray(eventRegistrations.eventId, eventIds))
        .as("ranked");
      return db
        .select({
          eventId: ranked.eventId,
          rn: ranked.rn,
          id: userProfiles.id,
          username: userProfiles.username,
          displayName: userProfiles.displayName,
          avatarUrl: userProfiles.avatarUrl,
        })
        .from(ranked)
        .innerJoin(userProfiles, eq(userProfiles.id, ranked.profileId))
        .where(lte(ranked.rn, RECENT_ATTENDEES))
        .orderBy(ranked.eventId, ranked.rn);
    })();

    const [viewerRegs, recentRows] = await Promise.all([viewerRegsPromise, recentPromise]);

    const viewerProfile = currentProfile
      ? {
          id: currentProfile.id,
          username: currentProfile.username,
          displayName: currentProfile.displayName,
          avatarUrl: currentProfile.avatarUrl,
        }
      : null;
    const regByEvent = new Map(
      viewerRegs.map(({ eventId, ...reg }) => [eventId, { ...reg, profile: viewerProfile }])
    );
    const recentByEvent = new Map<string, Array<{ id: string; username: string; displayName: string; avatarUrl: string | null }>>();
    for (const { eventId, rn: _rn, ...profile } of recentRows) {
      const bucket = recentByEvent.get(eventId);
      if (bucket) bucket.push(profile);
      else recentByEvent.set(eventId, [profile]);
    }

    const enriched = list.map((ev) => {
      const userReg = regByEvent.get(ev.id) ?? null;
      const isRegistered = Boolean(userReg);

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
        attendeeCount: Number(ev.attendeeCount) || 0,
        attendedCount: Number(ev.attendedCount) || 0,
        confirmedCount: Number(ev.confirmedCount) || 0,
        recentAttendees: recentByEvent.get(ev.id) ?? [],
        isRegistered,
        userRegistration: userReg,
        reminderSet: userReg?.reminderSet ?? false,
        isLiveNow,
        isClosingSoon,
        isClosed,
        createdAt: ev.createdAt,
      };
    });

    return NextResponse.json({
      events: enriched,
      metrics: {
        totalOpportunities: Number(metricsRow?.totalOpportunities) || 0,
        liveHackathons: Number(metricsRow?.liveHackathons) || 0,
        cashPrizeCount: Number(metricsRow?.cashPrizeCount) || 0,
        totalPrizePool: "₹15,00,000+",
        totalRegistrations: Number(metricsRow?.totalRegistrations) || 0,
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

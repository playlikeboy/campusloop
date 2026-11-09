import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { userProfiles } from "@/db/schema";
import { requireProfile } from "@/lib/require-profile";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await requireProfile();
    if (!auth.ok) return auth.response;
    const { profile: currentProfile } = auth;

    const db = getDb();

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "CAMPUS";
    const targetDateParam = searchParams.get("date"); // e.g. "2026-08-23" or "08-23"
    const targetMonthParam = searchParams.get("month"); // e.g. "8" or "08"

    // Fetch active profiles with public DOB
    const conditions = [
      eq(userProfiles.status, "ACTIVE"),
      eq(userProfiles.isDobPrivate, false),
      isNotNull(userProfiles.dob),
    ];

    if (scope === "CAMPUS" && currentProfile.institutionId) {
      conditions.push(eq(userProfiles.institutionId, currentProfile.institutionId));
    }

    // The response only ever needs birthdays within the next 60 days (at most
    // three calendar months from now), the requested date, and the requested
    // month, so restrict the scan to those months instead of every profile.
    const thisMonth = new Date().getMonth() + 1;
    const wantedMonths = new Set<number>([thisMonth, (thisMonth % 12) + 1, ((thisMonth + 1) % 12) + 1]);
    const requestedDateMonth = targetDateParam
      ? parseInt(targetDateParam.length === 10 ? targetDateParam.substring(5, 7) : targetDateParam.substring(0, 2), 10)
      : NaN;
    if (requestedDateMonth >= 1 && requestedDateMonth <= 12) wantedMonths.add(requestedDateMonth);
    const requestedMonth = targetMonthParam ? parseInt(targetMonthParam, 10) : NaN;
    if (requestedMonth >= 1 && requestedMonth <= 12) wantedMonths.add(requestedMonth);
    conditions.push(
      inArray(
        sql`lpad(split_part(${userProfiles.dob}, '-', 2), 2, '0')`,
        Array.from(wantedMonths).map((m) => String(m).padStart(2, "0"))
      )
    );

    const profiles = await db.query.userProfiles.findMany({
      where: and(...conditions),
      limit: 2000,
      with: {
        institution: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentDay = now.getDate(); // 1-31

    const todayMMDD = targetDateParam
      ? targetDateParam.length === 10
        ? targetDateParam.substring(5)
        : targetDateParam
      : `${String(currentMonth).padStart(2, "0")}-${String(currentDay).padStart(2, "0")}`;

    const todayCelebrants: typeof profiles = [];
    const upcomingCelebrants: Array<{
      profile: (typeof profiles)[number];
      daysUntil: number;
      birthMonth: number;
      birthDay: number;
    }> = [];
    const monthCelebrants: typeof profiles = [];

    const selectedMonthNum = targetMonthParam ? parseInt(targetMonthParam, 10) : null;

    for (const p of profiles) {
      if (!p.dob) continue;
      const parts = p.dob.split("-");
      if (parts.length < 3) continue;

      const birthMonth = parseInt(parts[1], 10);
      const birthDay = parseInt(parts[2], 10);
      const mmdd = `${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`;

      // Today's birthday
      if (mmdd === todayMMDD) {
        todayCelebrants.push(p);
      }

      // Filter by specified month if requested
      if (selectedMonthNum && birthMonth === selectedMonthNum) {
        monthCelebrants.push(p);
      }

      // Calculate days until next birthday
      const thisYearBirthday = new Date(now.getFullYear(), birthMonth - 1, birthDay);
      let diffDays = Math.ceil((thisYearBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        // Birthday already occurred this year, calculate for next year
        const nextYearBirthday = new Date(now.getFullYear() + 1, birthMonth - 1, birthDay);
        diffDays = Math.ceil((nextYearBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }

      if (diffDays >= 0 && diffDays <= 60 && mmdd !== todayMMDD) {
        upcomingCelebrants.push({
          profile: p,
          daysUntil: diffDays,
          birthMonth,
          birthDay,
        });
      }
    }

    // Sort upcoming by daysUntil ascending
    upcomingCelebrants.sort((a, b) => a.daysUntil - b.daysUntil);

    return NextResponse.json({
      today: todayCelebrants.map((p) => ({
        id: p.id,
        userId: p.userId,
        username: p.username,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
        course: p.course,
        branch: p.branch,
        gender: p.gender,
        dob: p.dob,
        institution: p.institution,
      })),
      upcoming: upcomingCelebrants.slice(0, 30).map((u) => ({
        id: u.profile.id,
        userId: u.profile.userId,
        username: u.profile.username,
        displayName: u.profile.displayName,
        avatarUrl: u.profile.avatarUrl,
        course: u.profile.course,
        branch: u.profile.branch,
        gender: u.profile.gender,
        dob: u.profile.dob,
        daysUntil: u.daysUntil,
        birthMonth: u.birthMonth,
        birthDay: u.birthDay,
        institution: u.profile.institution,
      })),
      byMonth: monthCelebrants.map((p) => ({
        id: p.id,
        userId: p.userId,
        username: p.username,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
        course: p.course,
        branch: p.branch,
        dob: p.dob,
        institution: p.institution,
      })),
      currentUserDob: currentProfile.dob,
      currentUserIsPrivate: currentProfile.isDobPrivate,
    });
  } catch (error) {
    console.error("Error fetching birthdays:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

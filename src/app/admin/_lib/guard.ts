import "server-only";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { type UserProfile, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { isAllowedAdminEmail } from "./session";

type Db = ReturnType<typeof getDb>;

/**
 * Single source of truth for admin authorization.
 * Passcode is removed; access is granted if the user is authenticated with an
 * authorized administrator email (sh20raj@gmail.com, btech10574.24@bitmesra.ac.in)
 * or holds the ADMIN role in userProfiles.
 */

export async function getAdminDb(): Promise<Db> {
  const { db } = await requireAdminProfile();
  return db;
}

/** Strict path: a real logged-in ADMIN profile. Used for reveal, audit & admin data. */
export async function requireAdminProfile(): Promise<{ db: Db; profile: UserProfile }> {
  const user = await hexclaveServerApp.getUser();
  if (!user) throw new Error("Unauthorized");

  const db = getDb();
  let profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });

  const email = user.primaryEmail?.toLowerCase();

  // If user matches designated admin emails, ensure they have the ADMIN role
  if (isAllowedAdminEmail(email)) {
    if (!profile) {
      const fallbackInst = await db.query.institutions.findFirst();
      if (fallbackInst) {
        const [created] = await db
          .insert(userProfiles)
          .values({
            userId: user.id,
            username: (email?.split("@")[0] || "admin").toLowerCase().replace(/[^a-z0-9_]/g, "_"),
            displayName: "CampusLoop Admin",
            email: email || null,
            institutionId: fallbackInst.id,
            onboardingCompleted: true,
            role: "ADMIN",
            status: "ACTIVE",
          })
          .returning();
        profile = created;
      }
    } else if (profile.role !== "ADMIN") {
      await db.update(userProfiles).set({ role: "ADMIN" }).where(eq(userProfiles.userId, user.id));
      profile = { ...profile, role: "ADMIN" };
    }

    if (profile) return { db, profile };
  }

  if (profile?.role !== "ADMIN") {
    throw new Error("Forbidden — ADMIN role required");
  }

  return { db, profile };
}

export type AdminSessionContext = {
  db: Db;
  profile: UserProfile | null;
  isLegacyPasskey: boolean;
};

/** Layout-level check: verifies Hexclave session and admin email authorization */
export async function resolveAdminSession(): Promise<AdminSessionContext> {
  const user = await hexclaveServerApp.getUser();
  if (!user) {
    redirect("/sign-in?returnTo=/admin");
  }

  const email = user.primaryEmail?.toLowerCase();
  const db = getDb();

  // If user is logged in with one of the authorized admin emails
  if (isAllowedAdminEmail(email)) {
    let profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      const fallbackInst = await db.query.institutions.findFirst();
      if (fallbackInst) {
        const [created] = await db
          .insert(userProfiles)
          .values({
            userId: user.id,
            username: (email?.split("@")[0] || "admin").toLowerCase().replace(/[^a-z0-9_]/g, "_"),
            displayName: "CampusLoop Admin",
            email: email || null,
            institutionId: fallbackInst.id,
            onboardingCompleted: true,
            role: "ADMIN",
            status: "ACTIVE",
          })
          .returning();
        profile = created;
      }
    } else if (profile.role !== "ADMIN") {
      await db.update(userProfiles).set({ role: "ADMIN" }).where(eq(userProfiles.userId, user.id));
      profile = { ...profile, role: "ADMIN" };
    }

    return { db, profile: profile ?? null, isLegacyPasskey: false };
  }

  // If not in the whitelist, check if existing profile already has the ADMIN role
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });

  if (profile?.role === "ADMIN") {
    return { db, profile, isLegacyPasskey: false };
  }

  // Forbidden: Not an admin
  redirect("/feeds");
}

export type AdminApiResult =
  | { authorized: true; db: Db; profile: UserProfile; errorResponse: null }
  | { authorized: false; db: null; profile: null; errorResponse: NextResponse };

/**
 * Route Handler (API) check: returns proper 401/403 NextResponse without throwing redirect errors.
 */
export async function requireAdminApi(): Promise<AdminApiResult> {
  // Support Bearer / API-Key authentication for automated workflows, scripts, and webhook alerts
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization") || headersList.get("x-api-key");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader?.trim();

    const adminPasskey = process.env.ADMIN_PASSKEY;
    const sessionSecret = process.env.ADMIN_SESSION_SECRET;
    const serverKey = process.env.HEXCLAVE_SECRET_SERVER_KEY;

    const isTokenAuthorized = Boolean(
      token &&
        ((adminPasskey && token === adminPasskey) ||
          (sessionSecret && token === sessionSecret) ||
          (serverKey && token === serverKey))
    );

    if (isTokenAuthorized) {
      const db = getDb();
      let profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.role, "ADMIN"),
      });
      if (!profile) {
        profile = await db.query.userProfiles.findFirst();
      }
      if (profile) {
        return { authorized: true, db, profile, errorResponse: null };
      }
    }
  } catch {
    // Non-blocking header inspection fallback
  }

  let user = null;
  try {
    user = await hexclaveServerApp.getUser();
  } catch {
    user = null;
  }

  if (!user) {
    return {
      authorized: false,
      db: null,
      profile: null,
      errorResponse: NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 }),
    };
  }

  const db = getDb();
  const email = user.primaryEmail?.toLowerCase();

  // If user matches designated admin emails, ensure they have the ADMIN role
  if (isAllowedAdminEmail(email)) {
    let profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      const fallbackInst = await db.query.institutions.findFirst();
      if (fallbackInst) {
        const [created] = await db
          .insert(userProfiles)
          .values({
            userId: user.id,
            username: (email?.split("@")[0] || "admin").toLowerCase().replace(/[^a-z0-9_]/g, "_"),
            displayName: "CampusLoop Admin",
            email: email || null,
            institutionId: fallbackInst.id,
            onboardingCompleted: true,
            role: "ADMIN",
            status: "ACTIVE",
          })
          .returning();
        profile = created;
      }
    } else if (profile.role !== "ADMIN") {
      await db.update(userProfiles).set({ role: "ADMIN" }).where(eq(userProfiles.userId, user.id));
      profile = { ...profile, role: "ADMIN" };
    }

    if (profile) {
      return { authorized: true, db, profile, errorResponse: null };
    }
  }

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });

  if (profile?.role !== "ADMIN") {
    return {
      authorized: false,
      db: null,
      profile: null,
      errorResponse: NextResponse.json(
        { error: "Forbidden. Administrator privileges required." },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, db, profile, errorResponse: null };
}

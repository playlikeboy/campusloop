import { eq, or } from "drizzle-orm";
import { emailUnsubscribes, userProfiles } from "@/db/schema";
import type { Db } from "./segments";

/**
 * Marketing-email opt-out. Only Admin -> Emails campaigns read this; security,
 * sign-in and account emails are sent regardless.
 */

function emailKey(profileId: string, email: string | null | undefined): string {
  return email?.trim().toLowerCase() || `no-email:${profileId}`;
}

export async function getProfileForUnsubscribe(db: Db, profileId: string) {
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.id, profileId),
    columns: { id: true, email: true, displayName: true },
  });
  if (!profile) return null;
  const existing = await db.query.emailUnsubscribes.findFirst({
    where: or(
      eq(emailUnsubscribes.profileId, profileId),
      eq(emailUnsubscribes.email, emailKey(profileId, profile.email))
    ),
    columns: { id: true },
  });
  return { ...profile, unsubscribed: Boolean(existing) };
}

export async function unsubscribeProfile(
  db: Db,
  profileId: string,
  source: "LINK" | "ONE_CLICK" | "ADMIN" = "LINK"
): Promise<boolean> {
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.id, profileId),
    columns: { id: true, email: true },
  });
  if (!profile) return false;
  await db
    .insert(emailUnsubscribes)
    .values({ profileId, email: emailKey(profileId, profile.email), source })
    .onConflictDoNothing();
  return true;
}

export async function resubscribeProfile(db: Db, profileId: string): Promise<boolean> {
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.id, profileId),
    columns: { id: true, email: true },
  });
  if (!profile) return false;
  await db
    .delete(emailUnsubscribes)
    .where(
      or(eq(emailUnsubscribes.profileId, profileId), eq(emailUnsubscribes.email, emailKey(profileId, profile.email)))
    );
  return true;
}

/** "ab•••@college.ac.in": enough to recognise, not enough to harvest. */
export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return "your email";
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}${"•".repeat(Math.max(1, Math.min(local.length - 2, 5)))}@${domain}`;
}

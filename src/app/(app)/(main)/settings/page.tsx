import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { privateMetadata } from "@/lib/seo";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export const metadata = privateMetadata("Settings");

export default async function SettingsPage() {
  const user = await hexclaveServerApp.getUser();
  if (!user) redirect("/sign-in");

  const db = getDb();
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
    with: {
      institution: true,
    },
  });

  if (!profile) redirect("/onboarding");

  return (
    <SettingsClient
      profile={{
        id: profile.id,
        displayName: profile.displayName,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        course: profile.course,
        branch: profile.branch,
        year: profile.year,
        role: profile.role,
        points: profile.points,
        institutionName: profile.institution?.name ?? null,
        anonymousUsername: profile.anonymousUsername,
        feedVisibility: profile.feedVisibility,
      }}
    />
  );
}

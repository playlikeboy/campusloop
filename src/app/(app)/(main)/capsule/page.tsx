import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { timeCapsules, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { privateMetadata } from "@/lib/seo";
import { CapsuleClient } from "./capsule-client";

export const dynamic = "force-dynamic";

export const metadata = privateMetadata("Time capsule");

export default async function CapsulePage() {
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

  const institutionId = profile.institutionId;
  let initialCapsules: any[] = [];

  if (institutionId) {
    const rawCapsules = await db.query.timeCapsules.findMany({
      where: eq(timeCapsules.institutionId, institutionId),
      orderBy: [desc(timeCapsules.createdAt)],
      with: {
        creator: {
          columns: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        entries: {
          with: {
            author: {
              columns: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    const now = new Date();
    initialCapsules = rawCapsules.map((c) => {
      const isActuallyUnlocked = c.isUnlocked || new Date(c.targetUnlockDate) <= now;
      const visibleEntries = isActuallyUnlocked
        ? c.entries.map((e) => ({
            ...e,
            // Anonymous entries must not reveal who wrote them
            authorId: e.isAnonymous ? null : e.authorId,
            author: e.isAnonymous ? null : e.author,
          }))
        : c.entries
            .filter((e) => e.authorId === profile.id)
            .map((e) => ({
              ...e,
              isBuriedByYou: true,
            }));

      return {
        ...c,
        isUnlocked: isActuallyUnlocked,
        entries: visibleEntries,
        totalEntriesBuried: c.entries.length,
      };
    });
  }

  return (
    <CapsuleClient
      initialCapsules={initialCapsules}
      profileId={profile.id}
      collegeName={profile.institution?.name}
      hasCollege={Boolean(institutionId)}
    />
  );
}

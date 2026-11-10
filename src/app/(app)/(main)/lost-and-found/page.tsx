import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { lostAndFoundItems } from "@/db/schema";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { LostFoundClient } from "./lost-found-client";

// Signed-in only. Single reports (/lost-and-found/[slug]) stay public and indexable.
export const metadata: Metadata = privateMetadata("Lost and found");

export default async function LostAndFoundPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; q?: string; type?: string }>;
}) {
  const params = await searchParams;

  // Old links used ?id=...; send them to the report's own page.
  if (params.id) {
    // A bad id (not a UUID) makes the query throw; fall through to the list.
    const item = await getDb()
      .query.lostAndFoundItems.findFirst({
        where: eq(lostAndFoundItems.id, params.id),
        columns: { id: true, slug: true },
      })
      .catch(() => undefined);
    if (item) redirect(`/lost-and-found/${item.slug || item.id}`);
  }

  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <LostFoundClient profileId={profile.id} campusId={profile.institutionId} />;
}

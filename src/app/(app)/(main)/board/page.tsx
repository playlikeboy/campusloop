import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BoardClient } from "@/components/board/board-client";
import { parseBoardTab } from "@/components/board/board-tabs";
import { getDb } from "@/db";
import { lostAndFoundItems } from "@/db/schema";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

// Signed-in only. Single lost-and-found reports (/lost-and-found/[slug]) stay public.
export const metadata: Metadata = privateMetadata("Campus board");

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[]; id?: string | string[] }>;
}) {
  const params = await searchParams;
  const tab = parseBoardTab(params.tab);

  // Old lost-and-found links used ?id=...; send them to the report's own page.
  const legacyId = Array.isArray(params.id) ? params.id[0] : params.id;
  if (tab === "lost-found" && legacyId) {
    // A bad id (not a UUID) makes the query throw; fall through to the list.
    const item = await getDb()
      .query.lostAndFoundItems.findFirst({
        where: eq(lostAndFoundItems.id, legacyId),
        columns: { id: true, slug: true },
      })
      .catch(() => undefined);
    if (item) redirect(`/lost-and-found/${item.slug || item.id}`);
  }

  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <BoardClient tab={tab} profileId={profile.id} campusId={profile.institutionId} />;
}

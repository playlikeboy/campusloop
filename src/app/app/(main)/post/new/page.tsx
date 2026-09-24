import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { communities, communityMembers, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { isViewerProfile } from "@/lib/viewer";
import { PostComposer } from "./post-composer";

export const metadata: Metadata = {
  title: "New Post",
  description: "Share a confession, start a poll, or ask your campus on CampusLoop.",
};

const POST_TYPES = ["NORMAL", "CONFESSION", "POLL", "QUESTION"] as const;
type PostTypeParam = (typeof POST_TYPES)[number];

interface NewPostPageProps {
  searchParams: Promise<{ type?: string; text?: string; communityId?: string }>;
}

export default async function NewPostPage({ searchParams }: NewPostPageProps) {
  const user = await hexclaveServerApp.getUser();
  if (!user) {
    redirect("/handler/sign-in");
  }

  const { type, text, communityId } = await searchParams;
  const requested = (type || "").toUpperCase() as PostTypeParam;
  const initialType = POST_TYPES.includes(requested) ? requested : "NORMAL";

  const profile = await getDb().query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });
  if (profile && (await isViewerProfile(profile))) {
    redirect("/app");
  }

  let communityName: string | undefined;
  let lockedCommunityId: string | undefined;

  if (communityId) {
    const communityRows = await getDb()
      .select({
        id: communities.id,
        name: communities.name,
        status: communityMembers.status,
      })
      .from(communities)
      .innerJoin(
        communityMembers,
        and(
          eq(communityMembers.communityId, communities.id),
          eq(communityMembers.userId, profile?.id || ""),
          eq(communityMembers.status, "ACTIVE")
        )
      )
      .where(eq(communities.id, communityId))
      .limit(1);

    const community = communityRows[0];
    if (!community) redirect("/app/communities");
    communityName = community.name;
    lockedCommunityId = community.id;
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col min-h-screen border-x border-border/30 bg-background">
      <PostComposer
        initialType={initialType}
        initialContent={text}
        variant="page"
        communityId={lockedCommunityId}
        lockedCommunityName={communityName}
      />
    </main>
  );
}

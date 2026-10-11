import { eq, or } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { communities, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { isViewerProfile } from "@/lib/viewer";
import { PostComposer } from "./post-composer";

const POST_TYPES = ["NORMAL", "MEME", "CONFESSION", "POLL", "QUESTION"] as const;
type PostTypeParam = (typeof POST_TYPES)[number];

interface NewPostPageProps {
  searchParams: Promise<{
    type?: string;
    text?: string;
    c?: string;
    slug?: string;
    community?: string;
    communityId?: string;
    feed?: string;
    scope?: string;
  }>;
}

export async function generateMetadata({ searchParams }: NewPostPageProps): Promise<Metadata> {
  const { type, c, slug, community, feed } = await searchParams;
  const targetSlug =
    c || slug || community || (feed?.startsWith("c/") ? feed.slice(2) : feed);

  if (targetSlug) {
    const cleanSlug = targetSlug.replace(/^c\//, "").trim();
    return {
      title: `Post in c/${cleanSlug} | CampusLoop`,
      description: `Share discussions, confessions, and questions with the c/${cleanSlug} community on CampusLoop.`,
    };
  }

  const requested = (type || "").toUpperCase() as PostTypeParam;
  const typeTitles: Record<string, string> = {
    CONFESSION: "Anonymous Confession",
    POLL: "Campus Poll",
    QUESTION: "Ask Campus",
    MEME: "Campus Meme",
    NORMAL: "New Post",
  };

  const title = typeTitles[requested] || "New Post";

  return {
    title: `${title} | CampusLoop`,
    description: "Share a confession, start a poll, or ask your campus on CampusLoop.",
  };
}

export default async function NewPostPage({ searchParams }: NewPostPageProps) {
  const user = await hexclaveServerApp.getUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { type, text, c, slug, community, communityId, feed, scope } = await searchParams;
  const requested = (type || "").toUpperCase() as PostTypeParam;
  const initialType = POST_TYPES.includes(requested) ? requested : "NORMAL";

  const db = getDb();
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });

  if (profile && (await isViewerProfile(profile))) {
    redirect("/feeds");
  }

  // Resolve preselected community if query param is provided
  const targetCommSlugOrId =
    communityId || c || slug || community || (feed?.startsWith("c/") ? feed.slice(2) : feed);

  let initialCommunityId: string | undefined = undefined;
  let initialCommunityName: string | undefined = undefined;

  if (targetCommSlugOrId && targetCommSlugOrId.trim().length > 0) {
    const cleanTarget = targetCommSlugOrId.replace(/^c\//, "").trim();
    try {
      const foundCommunity = await db.query.communities.findFirst({
        where: or(
          eq(communities.id, cleanTarget),
          eq(communities.slug, cleanTarget),
          eq(communities.name, cleanTarget)
        ),
        columns: { id: true, name: true, slug: true },
      });

      if (foundCommunity) {
        initialCommunityId = foundCommunity.id;
        initialCommunityName = foundCommunity.name;
      }
    } catch {
      // In case of query fallback, client-side hook will resolve
    }
  }

  const initialScope =
    scope?.toUpperCase() === "CAMPUS" ? ("CAMPUS" as const) : ("GLOBAL" as const);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col min-h-screen border-x border-border/30 bg-background pb-12 sm:pb-0">
      <PostComposer
        initialType={initialType}
        initialContent={text}
        communityId={initialCommunityId}
        initialScope={initialScope}
        lockedCommunityName={undefined}
        variant="page"
      />
    </main>
  );
}

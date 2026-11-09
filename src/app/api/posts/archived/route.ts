import { and, desc, eq, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { posts } from "@/db/schema";
import { parseBefore, parseLimit } from "@/lib/pagination";
import { requireProfile } from "@/lib/require-profile";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await requireProfile({ profileStatus: 403 });
    if (!auth.ok) return auth.response;
    const { profile } = auth;

    const { searchParams } = new URL(req.url);
    const limit = parseLimit(searchParams, 50, 100);
    const before = parseBefore(searchParams);

    const db = getDb();

    const archivedPosts = await db.query.posts.findMany({
      where: and(
        eq(posts.authorId, profile.id),
        eq(posts.status, "ARCHIVED"),
        before ? lt(posts.createdAt, before) : undefined
      ),
      orderBy: [desc(posts.createdAt)],
      limit,
      with: {
        author: true,
        institution: true,
        community: true,
        votes: true,
        comments: true,
        pollOptions: {
          with: { votes: true },
        },
      },
    });

    const formatted = archivedPosts.map((post) => ({
      ...post,
      votesCount: post.votes?.reduce((acc, v) => acc + v.value, 0) || 0,
      commentsCount: post.comments?.length || 0,
      userVote: 0,
      pollOptions: post.pollOptions?.map((o) => ({
        id: o.id,
        text: o.text,
        votesCount: o.votes?.length || 0,
        userVoted: false,
      })),
      totalPollVotes: post.pollOptions?.reduce((acc, o) => acc + (o.votes?.length || 0), 0) || 0,
      hasVotedPoll: false,
      votes: undefined,
      comments: undefined,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching archived posts:", error);
    return NextResponse.json({ error: "Failed to fetch archived posts" }, { status: 500 });
  }
}

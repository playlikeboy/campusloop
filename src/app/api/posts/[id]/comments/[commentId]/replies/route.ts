import { and, asc, eq, gt, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { comments, commentVotes, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

interface RouteParams {
  params: Promise<{ id: string; commentId: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id: postId, commentId: parentId } = await params;
    const url = new URL(req.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 10), 1), 30);
    const cursor = url.searchParams.get("cursor");

    const db = getDb();

    // Optional user authentication for personalized like hydration
    let currentProfileId: string | null = null;
    try {
      const user = await hexclaveServerApp.getUser();
      if (user) {
        const profile = await db.query.userProfiles.findFirst({
          where: eq(userProfiles.userId, user.id),
          columns: { id: true },
        });
        currentProfileId = profile?.id ?? null;
      }
    } catch {
      // Unauthenticated viewers are supported
    }

    const whereConditions = [
      eq(comments.postId, postId),
      eq(comments.parentId, parentId),
      eq(comments.status, "PUBLISHED"),
    ];

    if (cursor) {
      whereConditions.push(gt(comments.createdAt, new Date(cursor)));
    }

    const rawReplies = await db.query.comments.findMany({
      where: and(...whereConditions),
      orderBy: [asc(comments.createdAt)],
      limit: limit + 1,
      with: {
        author: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            points: true,
            institutionId: true,
          },
        },
        replyToUser: {
          columns: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    const hasMore = rawReplies.length > limit;
    const items = hasMore ? rawReplies.slice(0, limit) : rawReplies;
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    // Batch hydrate viewer votes
    const likedCommentIds = new Set<string>();
    if (currentProfileId && items.length > 0) {
      const itemIds = items.map((c) => c.id);
      const userVotes = await db
        .select({ commentId: commentVotes.commentId })
        .from(commentVotes)
        .where(
          and(
            eq(commentVotes.userId, currentProfileId),
            inArray(commentVotes.commentId, itemIds)
          )
        );
      for (const v of userVotes) {
        likedCommentIds.add(v.commentId);
      }
    }

    const sanitizedReplies = items.map((comment) => {
      const hasLiked = likedCommentIds.has(comment.id);
      if (!comment.isAnonymous) {
        return {
          ...comment,
          hasLiked,
          likesCount: comment.likesCount || 0,
          repliesCount: comment.repliesCount || 0,
        };
      }
      return {
        ...comment,
        author: null,
        hasLiked,
        likesCount: comment.likesCount || 0,
        repliesCount: comment.repliesCount || 0,
      };
    });

    return NextResponse.json({
      replies: sanitizedReplies,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching comment replies:", error);
    return NextResponse.json(
      { error: "Failed to fetch replies" },
      { status: 500 }
    );
  }
}

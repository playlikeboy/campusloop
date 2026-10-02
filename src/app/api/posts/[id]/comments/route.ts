import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { anonIdentityVault, comments, commentVotes, posts, reelComments, reels, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { deriveAnonHandle, openSealedIdentity, sealIdentity } from "@/lib/anonymity";
import { runSafetyCheck } from "@/lib/moderation/rules";
import { cleanNotificationSnippet, createNotification, notifyMentions } from "@/lib/notifications";
import { rejectViewerWrite } from "@/lib/viewer";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const requestedLimit = Number(searchParams.get("limit"));
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.floor(requestedLimit), 1), 100)
      : 50;
    const before = searchParams.get("before");
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

    const postComments = await db.query.comments.findMany({
      where: and(eq(comments.postId, id), eq(comments.status, "PUBLISHED")),
      orderBy: [asc(comments.createdAt)],
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

    // If no post comments found, check if it's a reel ID
    if (postComments.length === 0) {
      const reel = await db.query.reels.findFirst({
        where: eq(reels.id, id),
      });
      if (reel) {
        const reelCommentsList = await db
          .select({
            id: reelComments.id,
            body: reelComments.body,
            createdAt: reelComments.createdAt,
            author: {
              id: userProfiles.id,
              username: userProfiles.username,
              displayName: userProfiles.displayName,
              avatarUrl: userProfiles.avatarUrl,
              points: userProfiles.points,
            },
          })
          .from(reelComments)
          .leftJoin(userProfiles, eq(reelComments.authorId, userProfiles.id))
          .where(eq(reelComments.reelId, id))
          .orderBy(asc(reelComments.createdAt));

        return NextResponse.json(
          reelCommentsList.map((c) => ({
            id: c.id,
            postId: id,
            body: c.body,
            isAnonymous: false,
            status: "PUBLISHED",
            likesCount: 0,
            repliesCount: 0,
            isPinned: false,
            hasLiked: false,
            createdAt: c.createdAt.toISOString(),
            author: c.author
              ? {
                  id: c.author.id,
                  username: c.author.username,
                  displayName: c.author.displayName,
                  avatarUrl: c.author.avatarUrl,
                  points: c.author.points,
                }
              : null,
          }))
        );
      }
    }

    // Batch hydrate viewer votes
    const likedCommentIds = new Set<string>();
    if (currentProfileId && postComments.length > 0) {
      const itemIds = postCommentsAscending.map((c) => c.id);
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

    // Strip author identity for anonymous comments before it leaves the server.
    const sanitized = postCommentsAscending.map((comment) => {
      const hasLiked = likedCommentIds.has(comment.id);
      const enriched = {
        ...comment,
        hasLiked,
        likesCount: comment.likesCount || 0,
        repliesCount: comment.repliesCount || 0,
        isPinned: Boolean(comment.isPinned),
      };

      if (!enriched.isAnonymous) return enriched;
      const rest = { ...enriched } as Partial<Record<"author", unknown>>;
      delete rest.author;
      return { ...rest, author: null };
    });

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    const viewerBlocked = await rejectViewerWrite(profile);
    if (viewerBlocked) return viewerBlocked;

    const { body, isAnonymous, parentId, replyToUserId, imageUrl } = (await req.json()) as {
      body: string;
      isAnonymous?: boolean;
      parentId?: string;
      replyToUserId?: string;
      imageUrl?: string;
    };

    if (!body || body.trim().length === 0) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }

    const safety = runSafetyCheck({ body });
    if (safety.blocked) {
      return NextResponse.json(
        { error: safety.messages.join(" "), messages: safety.messages, riskScore: safety.riskScore },
        { status: 400 }
      );
    }

    const anonymous = Boolean(isAnonymous);
    const commentId = randomUUID();
    let anonHandle: string | null = null;

    if (anonymous) {
      if (profile.anonymousUsername) {
        anonHandle = profile.anonymousUsername;
      } else {
        try {
          anonHandle = deriveAnonHandle(profile.id);
        } catch (err) {
          console.warn("Anonymity hashing fallback:", err);
          anonHandle = `anon_${profile.id.slice(0, 8)}`;
        }
      }
    }

    // Check if target is a Post or a Reel
    const targetPost = await db.query.posts.findFirst({
      where: eq(posts.id, id),
    });

    if (!targetPost) {
      const targetReel = await db.query.reels.findFirst({
        where: eq(reels.id, id),
      });

      if (targetReel) {
        const [newReelComment] = await db
          .insert(reelComments)
          .values({
            reelId: id,
            authorId: profile.id,
            body: body.trim(),
          })
          .returning();

        // Always calculate true comments count from reelComments
        const [actualCommentsCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(reelComments)
          .where(eq(reelComments.reelId, id));

        await db
          .update(reels)
          .set({
            commentsCount: actualCommentsCount?.count || 0,
          })
          .where(eq(reels.id, id));

        try {
          await db
            .update(userProfiles)
            .set({ points: sql`${userProfiles.points} + 2` })
            .where(eq(userProfiles.id, profile.id));
        } catch {}

        return NextResponse.json({
          id: newReelComment.id,
          postId: id,
          body: newReelComment.body,
          isAnonymous: false,
          status: "PUBLISHED",
          likesCount: 0,
          repliesCount: 0,
          isPinned: false,
          hasLiked: false,
          createdAt: newReelComment.createdAt.toISOString(),
          author: {
            id: profile.id,
            username: profile.username,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            points: (profile.points || 0) + 2,
          },
        });
      }

      return NextResponse.json({ error: "Post or Reel not found" }, { status: 404 });
    }

    // Direct sequential insert (no nested db.transaction which breaks in Neon HTTP driver)
    const [newComment] = await db
      .insert(comments)
      .values({
        id: commentId,
        postId: id,
        authorId: anonymous ? null : profile.id,
        pseudonym: anonHandle,
        parentId: parentId || null,
        replyToUserId: replyToUserId || null,
        imageUrl: imageUrl || null,
        body: body.trim(),
        isAnonymous: anonymous,
        status: safety.status,
        likesCount: 0,
        repliesCount: 0,
        isPinned: false,
      })
      .returning();

    // Increment repliesCount on parent comment
    if (parentId) {
      try {
        await db
          .update(comments)
          .set({ repliesCount: sql`${comments.repliesCount} + 1` })
          .where(eq(comments.id, parentId));
      } catch (countErr) {
        console.warn("Could not increment repliesCount on parent comment:", countErr);
      }
    }

    if (anonymous && anonHandle) {
      try {
        await db
          .insert(anonIdentityVault)
          .values({
            handle: anonHandle,
            sealedIdentity: sealIdentity(profile.id),
          })
          .onConflictDoNothing({ target: anonIdentityVault.handle });
      } catch (err) {
        console.warn("Anon vault insert warning:", err);
      }
    }

    // Award +2 Loop Points safely
    try {
      await db
        .update(userProfiles)
        .set({ points: sql`${userProfiles.points} + 2` })
        .where(eq(userProfiles.id, profile.id));
    } catch (err) {
      console.warn("Points update warning:", err);
    }

    // Trigger in-app notifications safely without blocking the comment response
    try {
      const snippet = cleanNotificationSnippet(body);

      if (parentId) {
        const parentComment = await db.query.comments.findFirst({
          where: eq(comments.id, parentId),
        });
        let parentAuthorId = parentComment?.authorId;
        if (!parentAuthorId && parentComment?.isAnonymous && parentComment?.pseudonym) {
          const vault = await db.query.anonIdentityVault.findFirst({
            where: eq(anonIdentityVault.handle, parentComment.pseudonym),
          });
          if (vault?.sealedIdentity) {
            try {
              parentAuthorId = openSealedIdentity(vault.sealedIdentity);
            } catch {}
          }
        }
        if (parentAuthorId && parentAuthorId !== profile.id) {
          await createNotification({
            userId: parentAuthorId,
            type: "REPLY",
            actorId: profile.id,
            referenceId: id,
            previewText: snippet,
          });
        }
      } else {
        const targetPost = await db.query.posts.findFirst({
          where: eq(posts.id, id),
        });
        let postAuthorId = targetPost?.authorId;
        if (!postAuthorId && targetPost?.isAnonymous && targetPost?.pseudonym) {
          const vault = await db.query.anonIdentityVault.findFirst({
            where: eq(anonIdentityVault.handle, targetPost.pseudonym),
          });
          if (vault?.sealedIdentity) {
            try {
              postAuthorId = openSealedIdentity(vault.sealedIdentity);
            } catch {}
          }
        }
        if (postAuthorId && postAuthorId !== profile.id) {
          await createNotification({
            userId: postAuthorId,
            type: "COMMENT",
            actorId: profile.id,
            referenceId: id,
            previewText: snippet,
          });
        }
      }

      // Also trigger @mention notifications from comment body
      notifyMentions({
        text: body,
        actorId: profile.id,
        referenceId: id,
      }).catch((err) => console.warn("Comment mention notification error:", err));
    } catch (notifErr) {
      console.warn("Notification insert warning:", notifErr);
    }

    const hydratedResponse = {
      ...newComment,
      hasLiked: false,
      likesCount: 0,
      repliesCount: 0,
      isPinned: false,
      author: anonymous
        ? null
        : {
            id: profile.id,
            username: profile.username,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            points: (profile.points || 0) + 2,
            institutionId: profile.institutionId,
          },
    };

    return NextResponse.json(hydratedResponse, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create comment" },
      { status: 500 }
    );
  }
}

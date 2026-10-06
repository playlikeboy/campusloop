import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { MAX_POST_CHARS } from "@/constants/feed";
import { getDb } from "@/db";
import { anonIdentityVault, comments, pollOptions, posts, userProfiles, votes } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { deriveAnonHandle, openSealedIdentity } from "@/lib/anonymity";
import { runSafetyCheck } from "@/lib/moderation/rules";
import { indexPostVector } from "@/lib/qdrant/indexer";
import { rejectViewerWrite } from "@/lib/viewer";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function verifyPostOwnership(
  targetPost: typeof posts.$inferSelect,
  profile: typeof userProfiles.$inferSelect
): Promise<boolean> {
  if (profile.role === "ADMIN" || profile.role === "MODERATOR") {
    return true;
  }

  if (targetPost.authorId && targetPost.authorId === profile.id) {
    return true;
  }

  if (targetPost.isAnonymous && targetPost.pseudonym) {
    const userAnonHandle = profile.anonymousUsername || deriveAnonHandle(profile.id);
    if (targetPost.pseudonym !== userAnonHandle) {
      return false;
    }

    try {
      const db = getDb();
      const vaultEntry = await db.query.anonIdentityVault.findFirst({
        where: eq(anonIdentityVault.handle, targetPost.pseudonym),
      });

      if (vaultEntry?.sealedIdentity) {
        const unsealedId = openSealedIdentity(vaultEntry.sealedIdentity);
        return unsealedId === profile.id;
      }
    } catch {
      // Fall through to deterministic handle equality
    }

    return targetPost.pseudonym === userAnonHandle;
  }

  return false;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = getDb();

    // Optional user authentication for personalized vote hydration and moderator role check
    let viewerProfile: (typeof userProfiles.$inferSelect) | null = null;
    try {
      const user = await hexclaveServerApp.getUser();
      if (user) {
        viewerProfile = (await db.query.userProfiles.findFirst({
          where: eq(userProfiles.userId, user.id),
        })) ?? null;
      }
    } catch {
      // Unauthenticated viewers are supported
    }

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, id),
      with: {
        author: true,
        institution: true,
        community: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Enforce post visibility:
    // - DELETED returns 404
    // - PENDING_REVIEW or other non-published statuses are only visible to MODERATOR/ADMIN or the author
    if (post.status === "DELETED") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const isModerator =
      viewerProfile?.role === "MODERATOR" || viewerProfile?.role === "ADMIN";

    if (post.status !== "PUBLISHED") {
      const isAuthor = viewerProfile && post.authorId === viewerProfile.id;
      if (!isModerator && !isAuthor) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
    }

    // Calculated vote aggregates (NEVER return raw votes rows)
    const postVotes = await db.query.votes.findMany({
      where: eq(votes.postId, id),
      columns: { value: true, userId: true },
    });

    let upvotesCount = 0;
    let downvotesCount = 0;
    let userVote = 0;

    for (const v of postVotes) {
      if (v.value > 0) upvotesCount++;
      else if (v.value < 0) downvotesCount++;
      if (viewerProfile && v.userId === viewerProfile.id) {
        userVote = v.value;
      }
    }
    const votesCount = upvotesCount - downvotesCount;

    // Fetch published comments (safe projection only)
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
            branch: true,
            year: true,
          },
        },
      },
    });

    const commentsCount = postComments.length;

    const safeComments = postComments.map((c) => ({
      id: c.id,
      postId: c.postId,
      body: c.body,
      createdAt: c.createdAt,
      isAnonymous: c.isAnonymous,
      pseudonym: c.pseudonym,
      likesCount: c.likesCount || 0,
      repliesCount: c.repliesCount || 0,
      parentId: c.parentId,
      imageUrl: c.imageUrl,
      isPinned: Boolean(c.isPinned),
      authorId: c.isAnonymous ? null : c.authorId,
      author: c.isAnonymous
        ? null
        : c.author
        ? {
            id: c.author.id,
            username: c.author.username,
            displayName: c.author.displayName,
            avatarUrl: c.author.avatarUrl,
            branch: c.author.branch,
            year: c.author.year,
          }
        : null,
    }));

    // Poll options aggregates (NEVER return raw pollVotes rows)
    let pollOptionsData: Array<{
      id: string;
      text: string;
      voteCount: number;
      selectedByViewer: boolean;
    }> = [];

    if (post.type === "POLL") {
      const options = await db.query.pollOptions.findMany({
        where: eq(pollOptions.postId, id),
        orderBy: [asc(pollOptions.createdAt)],
        with: {
          votes: {
            columns: { userId: true },
          },
        },
      });

      pollOptionsData = options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        voteCount: opt.votes?.length || 0,
        selectedByViewer: Boolean(
          viewerProfile && opt.votes?.some((v) => v.userId === viewerProfile.id)
        ),
      }));
    }

    // Safe author projection: strip authentication fields & anonymous profile IDs
    const safeAuthor = post.isAnonymous
      ? null
      : post.author
      ? {
          id: post.author.id,
          username: post.author.username,
          displayName: post.author.displayName,
          avatarUrl: post.author.avatarUrl,
          branch: post.author.branch,
          year: post.author.year,
          institutionId: post.author.institutionId,
        }
      : null;

    const safePost = {
      id: post.id,
      type: post.type,
      scope: post.scope,
      title: post.title,
      body: post.body,
      isAnonymous: post.isAnonymous,
      pseudonym: post.pseudonym,
      isEdited: post.isEdited,
      repostOfId: post.repostOfId,
      repostComment: post.repostComment,
      status: post.status,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      institutionId: post.institutionId,
      institution: post.institution
        ? {
            id: post.institution.id,
            name: post.institution.name,
            slug: post.institution.slug,
            state: post.institution.state,
          }
        : null,
      communityId: post.communityId,
      community: post.community
        ? {
            id: post.community.id,
            name: post.community.name,
            slug: post.community.slug,
            avatarUrl: post.community.avatarUrl,
          }
        : null,
      authorId: post.isAnonymous ? null : post.authorId,
      author: safeAuthor,
      votesCount,
      upvotesCount,
      downvotesCount,
      voteScore: votesCount,
      userVote,
      commentsCount,
      pollOptions: pollOptionsData,
      comments: safeComments,
    };

    return NextResponse.json(safePost);
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
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

    const targetPost = await db.query.posts.findFirst({
      where: eq(posts.id, id),
    });

    if (!targetPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (targetPost.status === "DELETED") {
      return NextResponse.json({ error: "Cannot edit a deleted post" }, { status: 400 });
    }

    const hasPermission = await verifyPostOwnership(targetPost, profile);
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden. You can only edit your own posts." }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const { body, title, scope } = payload as {
      body?: string;
      title?: string | null;
      scope?: "CAMPUS" | "GLOBAL";
    };

    if (typeof body !== "string" || body.trim().length === 0) {
      return NextResponse.json({ error: "Post body cannot be empty" }, { status: 400 });
    }

    if (body.length > MAX_POST_CHARS) {
      return NextResponse.json(
        { error: `Post body cannot exceed ${MAX_POST_CHARS} characters` },
        { status: 400 }
      );
    }

    const trimmedBody = body.trim();
    const trimmedTitle = typeof title === "string" ? (title.trim() ? title.trim() : null) : targetPost.title;

    // Run content safety & moderation check
    const safety = runSafetyCheck({ title: trimmedTitle || undefined, body: trimmedBody });
    if (safety.blocked) {
      return NextResponse.json(
        { error: safety.messages.join(" "), messages: safety.messages, riskScore: safety.riskScore },
        { status: 400 }
      );
    }

    const [updatedPost] = await db
      .update(posts)
      .set({
        body: trimmedBody,
        title: trimmedTitle,
        scope: scope || targetPost.scope,
        isEdited: true,
        updatedAt: new Date(),
        status: safety.status,
        riskScore: safety.riskScore,
      })
      .where(eq(posts.id, id))
      .returning();

    // Fire-and-forget vector re-indexing into Qdrant
    indexPostVector({
      id: updatedPost.id,
      title: updatedPost.title,
      body: updatedPost.body,
      type: updatedPost.type,
      scope: updatedPost.scope,
      isAnonymous: updatedPost.isAnonymous,
      institutionId: updatedPost.institutionId,
      authorId: updatedPost.authorId,
    }).catch((err) => console.warn("Vector update error:", err));

    return NextResponse.json({
      success: true,
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
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

    const targetPost = await db.query.posts.findFirst({
      where: eq(posts.id, id),
    });

    if (!targetPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const hasPermission = await verifyPostOwnership(targetPost, profile);
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden. You can only delete your own posts." }, { status: 403 });
    }

    // Mark as DELETED to maintain referential integrity with reposts/comments or delete cleanly
    await db.update(posts).set({ status: "DELETED" }).where(eq(posts.id, id));

    return NextResponse.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}

import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { MAX_POST_CHARS } from "@/constants/feed";
import { getDb } from "@/db";
import { anonIdentityVault, communities, pollOptions, posts, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { deriveAnonHandle, sealIdentity } from "@/lib/anonymity";
import { assertCanCreateCommunityPost, CommunityPostAuthError } from "@/lib/communities";
import { runSafetyCheck } from "@/lib/moderation/rules";
import { notifyMentions } from "@/lib/notifications";
import { notifyFollowersOfNewPost } from "@/lib/post-notifications";
import { indexPostVector } from "@/lib/qdrant/indexer";
import { rejectViewerWrite } from "@/lib/viewer";

const ALLOWED_POST_TYPES = new Set([
  "NORMAL",
  "ANONYMOUS",
  "CONFESSION",
  "POLL",
  "QUESTION",
  "MEME",
  "EVENT",
  "LOST_FOUND",
]);

const ALLOWED_POST_SCOPES = new Set([
  "CAMPUS",
  "STATE",
  "INDIA",
  "GLOBAL",
]);

export async function POST(req: Request) {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    const viewerBlocked = await rejectViewerWrite(profile);
    if (viewerBlocked) return viewerBlocked;

    const data = await req.json().catch(() => ({}));
    const { body, type, scope, isAnonymous, title, options, communityId } = data as {
      body?: unknown;
      type?: unknown;
      scope?: unknown;
      isAnonymous?: unknown;
      title?: unknown;
      options?: unknown;
      communityId?: unknown;
    };

    // Body validation and length enforcement
    if (typeof body !== "string" || body.trim().length === 0) {
      return NextResponse.json({ error: "Post body cannot be empty" }, { status: 400 });
    }

    const trimmedBody = body.trim();
    if (trimmedBody.length > MAX_POST_CHARS) {
      return NextResponse.json(
        { error: `Post body cannot exceed ${MAX_POST_CHARS} characters` },
        { status: 400 }
      );
    }

    // Title validation and trimming
    let trimmedTitle: string | null = null;
    if (typeof title === "string" && title.trim().length > 0) {
      trimmedTitle = title.trim();
      if (trimmedTitle.length > 200) {
        return NextResponse.json(
          { error: "Post title cannot exceed 200 characters" },
          { status: 400 }
        );
      }
    }

    // Post type validation against explicit allowlist
    const postType = typeof type === "string" ? type.toUpperCase() : "NORMAL";
    if (!ALLOWED_POST_TYPES.has(postType)) {
      return NextResponse.json(
        { error: `Invalid post type. Allowed types: ${Array.from(ALLOWED_POST_TYPES).join(", ")}` },
        { status: 400 }
      );
    }

    // Scope validation against explicit allowlist
    const postScope = typeof scope === "string" ? scope.toUpperCase() : "GLOBAL";
    if (!ALLOWED_POST_SCOPES.has(postScope)) {
      return NextResponse.json(
        { error: `Invalid post scope. Allowed scopes: ${Array.from(ALLOWED_POST_SCOPES).join(", ")}` },
        { status: 400 }
      );
    }

    const anonymous = Boolean(isAnonymous);

    // Centralized safety engine (PII / doxxing / threats / abuse)
    const safety = runSafetyCheck({ title: trimmedTitle ?? undefined, body: trimmedBody });
    if (safety.blocked) {
      return NextResponse.json(
        { error: safety.messages.join(" "), messages: safety.messages, riskScore: safety.riskScore },
        { status: 400 }
      );
    }

    // Community post authorization
    let targetCommunity = null;
    if (typeof communityId === "string" && communityId.trim().length > 0) {
      try {
        targetCommunity = await assertCanCreateCommunityPost(profile.id, communityId.trim(), {
          isAnonymous: anonymous,
          type: postType,
        });
      } catch (err) {
        if (err instanceof CommunityPostAuthError) {
          return NextResponse.json({ error: err.message }, { status: err.status });
        }
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "Community authorization error" },
          { status: 400 }
        );
      }
    }

    // Poll options validation: minimum 2, maximum 6, distinct, non-empty trimmed strings
    let pollTexts: string[] = [];
    if (postType === "POLL") {
      if (!Array.isArray(options)) {
        return NextResponse.json({ error: "Poll options must be an array" }, { status: 400 });
      }

      const rawTrimmed = options
        .filter((opt): opt is string => typeof opt === "string")
        .map((opt) => opt.trim())
        .filter((opt) => opt.length > 0);

      const distinctOptions = Array.from(new Set(rawTrimmed));

      if (distinctOptions.length < 2) {
        return NextResponse.json(
          { error: "A poll must have at least 2 distinct non-empty options" },
          { status: 400 }
        );
      }

      if (distinctOptions.length > 6) {
        return NextResponse.json(
          { error: "A poll cannot have more than 6 options" },
          { status: 400 }
        );
      }

      pollTexts = distinctOptions;
    }

    const postId = randomUUID();

    // Anonymous posts carry NO author foreign key. The real profile id is
    // AES-sealed into the identity vault; the post row holds the student's custom
    // anonymous username or falls back to the deterministic HMAC pseudonym handle.
    const activePseudonym = profile.anonymousUsername
      ? profile.anonymousUsername
      : deriveAnonHandle(profile.id);

    if (anonymous) {
      await db
        .insert(anonIdentityVault)
        .values({
          handle: activePseudonym,
          sealedIdentity: sealIdentity(profile.id),
        })
        .onConflictDoNothing({ target: anonIdentityVault.handle });
    }

    const [newPost] = await db
      .insert(posts)
      .values({
        id: postId,
        authorId: anonymous ? null : profile.id,
        pseudonym: anonymous ? activePseudonym : null,
        institutionId: profile.institutionId,
        body: trimmedBody,
        type: postType as typeof posts.$inferInsert.type,
        scope: postScope as typeof posts.$inferInsert.scope,
        isAnonymous: anonymous,
        title: trimmedTitle,
        communityId: targetCommunity ? targetCommunity.id : null,
        status: safety.status,
        riskScore: safety.riskScore,
      })
      .returning();

    // Award +5 points to author
    await db
      .update(userProfiles)
      .set({ points: sql`${userProfiles.points} + 5` })
      .where(eq(userProfiles.id, profile.id));

    // Award +5 points to community if posted inside a community
    if (targetCommunity) {
      await db
        .update(communities)
        .set({ points: sql`${communities.points} + 5` })
        .where(eq(communities.id, targetCommunity.id));
    }

    if (pollTexts.length > 0) {
      await db.insert(pollOptions).values(pollTexts.map((text) => ({ postId: newPost.id, text })));
    }

    // Trigger @mention notifications asynchronously
    notifyMentions({
      text: trimmedBody,
      actorId: profile.id,
      referenceId: newPost.id,
    }).catch((err) => console.warn("Mention notification error:", err));

    // Tell followers and friends there is something new. Anonymous posts are
    // filtered out inside the helper — an author-attributed ping would undo the
    // anonymity the post row is careful to preserve.
    notifyFollowersOfNewPost({
      postId: newPost.id,
      authorId: anonymous ? null : profile.id,
      isAnonymous: anonymous,
      title: trimmedTitle,
      body: trimmedBody,
    }).catch((err) => console.warn("New post notification error:", err));

    // Asynchronously index post vector in Qdrant (fire-and-forget)
    indexPostVector({
      id: newPost.id,
      title: trimmedTitle,
      body: trimmedBody,
      type: postType,
      scope: postScope,
      isAnonymous: anonymous,
      institutionId: profile.institutionId,
      authorId: anonymous ? null : profile.id,
    }).catch(() => {});

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

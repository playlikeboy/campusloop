import { randomUUID } from "node:crypto";
import { and, eq, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { communities, communityWebhooks, posts, userProfiles } from "@/db/schema";
import { runInBackground } from "@/lib/background";
import { runSafetyCheck } from "@/lib/moderation/rules";
import { notifyMentions } from "@/lib/notifications";
import { indexPostVector } from "@/lib/qdrant/indexer";
import { timingSafeCompare } from "@/lib/security/timing";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteProps) {
  const { id } = await params;
  return NextResponse.json({
    service: "CampusLoop Community Inbound Webhook API",
    communityId: id,
    usage: {
      method: "POST",
      endpoint: `/api/communities/${id}/webhook?token=YOUR_WEBHOOK_TOKEN`,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer YOUR_WEBHOOK_TOKEN (optional alternative)",
      },
      payloadFields: {
        body: "string (required) — Markdown formatted message body. Also accepts 'content' or 'text'",
        title: "string (optional) — Post heading / title",
        botName: "string (optional) — Display name override for the bot",
        avatarUrl: "string (optional) — Image URL for the bot avatar",
      },
      exampleCurl: `curl -X POST "https://campusloop.space/api/communities/${id}/webhook?token=YOUR_TOKEN" -H "Content-Type: application/json" -d '{"body": "Hello c/community! New update available.", "title": "Announcement"}'`,
    },
  });
}

export async function POST(req: Request, { params }: RouteProps) {
  try {
    const { id: communityParam } = await params;
    const url = new URL(req.url);

    // Extract secret token from query param, Authorization header, or custom header
    const token =
      url.searchParams.get("token") ||
      req.headers.get("x-campusloop-token") ||
      req.headers
        .get("authorization")
        ?.replace(/^Bearer\s+/i, "")
        ?.trim();

    if (!token) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Missing webhook token. Pass ?token=YOUR_TOKEN or Authorization: Bearer YOUR_TOKEN",
        },
        { status: 401 }
      );
    }

    const db = getDb();

    // Find community by ID or slug
    const comm = await db.query.communities.findFirst({
      where: or(eq(communities.id, communityParam), eq(communities.slug, communityParam)),
    });

    if (!comm) {
      return NextResponse.json(
        { error: "Not Found", message: `Community '${communityParam}' does not exist` },
        { status: 404 }
      );
    }

    // Lookup webhook belonging to this community with the given token
    const webhooks = await db.query.communityWebhooks.findMany({
      where: eq(communityWebhooks.communityId, comm.id),
    });

    const webhook = webhooks.find((w) => timingSafeCompare(w.token, token));

    if (!webhook) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid webhook token for this community" },
        { status: 401 }
      );
    }

    if (!webhook.isActive) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "This webhook is currently paused/inactive. Activate it in community settings.",
        },
        { status: 403 }
      );
    }

    // Parse payload (supports CampusLoop, Discord, and Slack payloads)
    let data: Record<string, unknown> = {};
    try {
      const rawText = await req.text();
      if (rawText && rawText.trim().length > 0) {
        data = JSON.parse(rawText);
      }
    } catch {
      return NextResponse.json({ error: "Bad Request", message: "Invalid JSON payload" }, { status: 400 });
    }

    const body =
      (typeof data.body === "string" ? data.body : "") ||
      (typeof data.content === "string" ? data.content : "") ||
      (typeof data.text === "string" ? data.text : "") ||
      (typeof data.message === "string" ? data.message : "");

    const title = typeof data.title === "string" && data.title.trim().length > 0 ? data.title.trim() : null;

    const botName =
      (typeof data.botName === "string" && data.botName.trim().length > 0 ? data.botName.trim() : null) ||
      (typeof data.username === "string" && data.username.trim().length > 0 ? data.username.trim() : null) ||
      webhook.botName ||
      "CampusBot";

    if (!body || body.trim().length === 0) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Post body cannot be empty. Supply 'body', 'content', or 'text'",
        },
        { status: 400 }
      );
    }

    // Safety and moderation checks
    const safety = runSafetyCheck({ title: title || undefined, body });
    if (safety.blocked) {
      return NextResponse.json(
        {
          error: "Content Blocked",
          message: safety.messages.join(" "),
          riskScore: safety.riskScore,
        },
        { status: 400 }
      );
    }

    // Creator lookup for institution attribution
    const creator = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, webhook.createdById),
    });

    let targetInstitutionId = creator?.institutionId;
    if (!targetInstitutionId) {
      const commCreator = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.id, comm.creatorId),
      });
      targetInstitutionId = commCreator?.institutionId;
    }
    if (!targetInstitutionId) {
      const fallbackInst = await db.query.institutions.findFirst();
      targetInstitutionId = fallbackInst?.id || "";
    }

    const postId = randomUUID();

    const [newPost] = await db
      .insert(posts)
      .values({
        id: postId,
        authorId: webhook.createdById,
        pseudonym: `[Bot] ${botName}`,
        institutionId: targetInstitutionId,
        type: "NORMAL",
        scope: "CAMPUS",
        isAnonymous: false,
        title: title || null,
        body: body.trim(),
        communityId: comm.id,
        status: safety.status,
        riskScore: safety.riskScore,
      })
      .returning();

    // Increment webhook usage metrics
    await db
      .update(communityWebhooks)
      .set({
        postsCount: sql`${communityWebhooks.postsCount} + 1`,
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(communityWebhooks.id, webhook.id));

    // Award +5 community points
    await db
      .update(communities)
      .set({ points: sql`${communities.points} + 5` })
      .where(eq(communities.id, comm.id));

    // Async Qdrant indexing
    indexPostVector({
      id: newPost.id,
      title: title || null,
      body: body.trim(),
      type: "NORMAL",
      scope: "CAMPUS",
      isAnonymous: false,
      institutionId: creator?.institutionId || comm.creatorId,
      authorId: webhook.createdById,
    }).catch(() => {});

    // Async mention notifications
    runInBackground(
      notifyMentions({
        text: body.trim(),
        actorId: webhook.createdById,
        referenceId: newPost.id,
      }),
      "webhook mention notifications"
    );

    return NextResponse.json(
      {
        success: true,
        postId: newPost.id,
        postUrl: `/post/${newPost.id}`,
        community: {
          id: comm.id,
          name: comm.name,
          slug: comm.slug,
        },
        botName,
        createdAt: newPost.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in community webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

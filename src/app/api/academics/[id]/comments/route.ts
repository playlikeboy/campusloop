import { and, desc, eq, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { academicResourceComments } from "@/db/schema";
import { pageOf, parseBefore, parseLimit } from "@/lib/pagination";
import { requireProfile } from "@/lib/require-profile";
import { rejectViewerWrite } from "@/lib/viewer";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseLimit(searchParams, 100, 200);
    const before = parseBefore(searchParams);
    const db = getDb();

    const rows = await db.query.academicResourceComments.findMany({
      where: and(
        eq(academicResourceComments.resourceId, id),
        before ? lt(academicResourceComments.createdAt, before) : undefined
      ),
      orderBy: [desc(academicResourceComments.createdAt)],
      limit: limit + 1,
      with: {
        author: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            points: true,
          },
        },
      },
    });

    const { page: comments, hasMore, nextCursor } = pageOf(rows, limit);

    return NextResponse.json({ comments, hasMore, nextCursor });
  } catch (error) {
    console.error("Error fetching academic comments:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await requireProfile({ profileStatus: 403 });
    if (!auth.ok) return auth.response;
    const { profile } = auth;

    const db = getDb();

    const viewerBlocked = await rejectViewerWrite(profile);
    if (viewerBlocked) return viewerBlocked;

    const body = (await req.json()) as Record<string, any>;
    const commentBody = body.body?.trim();
    const isHelpful = body.isHelpful !== false;

    if (!commentBody) {
      return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
    }

    const [comment] = await db
      .insert(academicResourceComments)
      .values({
        resourceId: id,
        authorId: profile.id,
        body: commentBody,
        isHelpful,
      })
      .returning();

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        author: {
          id: profile.id,
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          points: profile.points,
        },
      },
    });
  } catch (error) {
    console.error("Error posting academic comment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

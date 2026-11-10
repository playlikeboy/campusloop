import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { articleComments } from "@/db/schema";
import { requireProfile } from "@/lib/require-profile";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ slug: string; commentId: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteProps) {
  try {
    const { commentId } = await params;
    const auth = await requireProfile();
    if (!auth.ok) return auth.response;
    const { profile } = auth;

    const db = getDb();

    const comment = await db.query.articleComments.findFirst({
      where: eq(articleComments.id, commentId),
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.authorId !== profile.id && profile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: You can only delete your own comments" }, { status: 403 });
    }

    await db.delete(articleComments).where(eq(articleComments.id, commentId));

    return NextResponse.json({ ok: true, message: "Comment deleted" });
  } catch (error) {
    console.error("DELETE article comment error:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}

import { desc, ilike, sql } from "drizzle-orm";
import { MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import { comments } from "@/db/schema";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { CommentsTable } from "./comments-table";

export const metadata: Metadata = {
  title: "Comments Moderation",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminCommentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { db } = await resolveAdminSession();

  const q = params.q || "";
  const page = Math.max(1, Number(params.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  // Search filtering clause
  const whereClause = q ? ilike(comments.body, `%${q}%`) : undefined;

  // Get total count
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(comments).where(whereClause);

  const totalCount = countResult[0]?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  // Fetch comments
  const list = await db.query.comments.findMany({
    where: whereClause,
    limit,
    offset,
    orderBy: [desc(comments.createdAt)],
    with: {
      author: true,
      post: true,
    },
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Comment Moderation"
        category="Content & Campus"
        icon={MessageSquare}
        description="Inspect threaded discussions, remove toxic replies, and maintain positive campus conversations."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border/40">
            {totalCount.toLocaleString()} comments
          </span>
        }
      />

      <CommentsTable initialComments={list} page={page} totalPages={totalPages} />
    </div>
  );
}

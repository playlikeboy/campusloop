import { desc, ilike, sql } from "drizzle-orm";
import { MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { comments } from "@/db/schema";
import { privateMetadata } from "@/lib/seo";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { CommentsTable } from "./comments-table";

export const metadata: Metadata = privateMetadata("Comments");

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
        title="Comments"
        icon={MessageSquare}
        description="Read comment threads and remove harmful replies."
        badge={<Badge variant="neutral">{totalCount.toLocaleString()} comments</Badge>}
      />

      <CommentsTable initialComments={list} page={page} totalPages={totalPages} />
    </div>
  );
}

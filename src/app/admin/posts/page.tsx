import { and, count, desc, eq, ilike, type SQL } from "drizzle-orm";
import { FileText } from "lucide-react";
import type { Metadata } from "next";
import { posts } from "@/db/schema";
import { getShowSeededPosts } from "@/lib/platform-config";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { PostsTable } from "./posts-table";

export const metadata: Metadata = {
  title: "Posts Moderation & Unlist Controls",
};

export type PostStatusFilter = "ALL" | "PUBLISHED" | "PENDING_REVIEW" | "HIDDEN" | "DELETED";
export type PostAnonFilter = "all" | "anon" | "public";
export type PostOriginFilter = "all" | "real" | "seeded";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    status?: string;
    anon?: string;
    origin?: string;
  }>;
}

function normalizeStatus(value?: string): PostStatusFilter {
  const allowed: PostStatusFilter[] = ["ALL", "PUBLISHED", "PENDING_REVIEW", "HIDDEN", "DELETED"];
  return allowed.includes((value ?? "ALL") as PostStatusFilter) ? (value as PostStatusFilter) : "ALL";
}

function normalizeAnon(value?: string): PostAnonFilter {
  return value === "anon" || value === "public" ? value : "all";
}

function normalizeOrigin(value?: string): PostOriginFilter {
  return value === "real" || value === "seeded" ? value : "all";
}

export default async function AdminPostsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { db } = await resolveAdminSession();

  const q = params.q || "";
  const page = Math.max(1, Number(params.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const status = normalizeStatus(params.status);
  const anon = normalizeAnon(params.anon);
  const origin = normalizeOrigin(params.origin);

  const conditions: SQL[] = [];
  if (q) conditions.push(ilike(posts.body, `%${q}%`));
  if (status !== "ALL") conditions.push(eq(posts.status, status));
  if (anon === "anon") conditions.push(eq(posts.isAnonymous, true));
  if (anon === "public") conditions.push(eq(posts.isAnonymous, false));
  if (origin === "real") conditions.push(eq(posts.isSeeded, false));
  if (origin === "seeded") conditions.push(eq(posts.isSeeded, true));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [[totals], [realStats], [seededStats], list, isSeededVisible] = await Promise.all([
    db.select({ total: count() }).from(posts).where(whereClause),
    db
      .select({
        totalReal: count(),
      })
      .from(posts)
      .where(eq(posts.isSeeded, false)),
    db
      .select({
        totalSeeded: count(),
      })
      .from(posts)
      .where(eq(posts.isSeeded, true)),
    db.query.posts.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(posts.createdAt)],
      with: {
        institution: true,
        author: true,
      },
    }),
    getShowSeededPosts(),
  ]);

  const totalCount = totals?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Post Moderation & Visibility Controls"
        category="Content & Campus"
        icon={FileText}
        description="Filter authentic student discussions vs seeded feeds, audit risk indicators, and manage instant timeline publication."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border/40">
            {totalCount.toLocaleString()} posts
          </span>
        }
      />

      <PostsTable
        initialPosts={list as any}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        activeStatus={status}
        activeAnon={anon}
        activeOrigin={origin}
        realCount={realStats?.totalReal || 0}
        seededCount={seededStats?.totalSeeded || 0}
        initialShowSeededPosts={isSeededVisible}
      />
    </div>
  );
}

import { and, desc, eq } from "drizzle-orm";
import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { posts, reports, userProfiles } from "@/db/schema";
import { privateMetadata } from "@/lib/seo";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { ReportsTable } from "./reports-table";

export const metadata: Metadata = privateMetadata("Reports");

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const { db } = await resolveAdminSession();

  const openReports = await db
    .select({
      id: reports.id,
      reason: reports.reason,
      details: reports.details,
      createdAt: reports.createdAt,
      postId: posts.id,
      postBody: posts.body,
      postPseudonym: posts.pseudonym,
      authorDisplayName: userProfiles.displayName,
      authorUsername: userProfiles.username,
    })
    .from(reports)
    .innerJoin(posts, eq(reports.targetId, posts.id))
    .leftJoin(userProfiles, eq(posts.authorId, userProfiles.id))
    .where(and(eq(reports.status, "OPEN"), eq(reports.targetType, "POST")))
    .orderBy(desc(reports.createdAt));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Reports"
        icon={ShieldAlert}
        description="Reports from students about posts, comments and people."
        badge={<Badge variant="danger">{openReports.length} open</Badge>}
      />

      <ReportsTable initialReports={openReports} />
    </div>
  );
}

import { and, desc, eq } from "drizzle-orm";
import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import { posts, reports, userProfiles } from "@/db/schema";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { ReportsTable } from "./reports-table";

export const metadata: Metadata = {
  title: "Reports & Safety Queue",
};

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
        title="Content Reports Queue"
        category="Operations & Safety"
        icon={ShieldAlert}
        description="Review student complaints, harassment flags, and rule violations reported across college hubs."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">
            {openReports.length} open
          </span>
        }
      />

      <ReportsTable initialReports={openReports} />
    </div>
  );
}

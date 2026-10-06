import { desc, eq } from "drizzle-orm";
import { BookOpen } from "lucide-react";
import type { Metadata } from "next";
import { academicResources, institutions, userProfiles } from "@/db/schema";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { AcademicsAdminClient } from "./academics-admin-client";

export const metadata: Metadata = {
  title: "Academics Vault Moderation",
};

export const dynamic = "force-dynamic";

export default async function AdminAcademicsPage() {
  const { db } = await resolveAdminSession();

  const rawResources = await db
    .select({
      id: academicResources.id,
      title: academicResources.title,
      description: academicResources.description,
      subjectCode: academicResources.subjectCode,
      subjectName: academicResources.subjectName,
      branch: academicResources.branch,
      semester: academicResources.semester,
      resourceType: academicResources.resourceType,
      fileUrl: academicResources.fileUrl,
      driveUrl: academicResources.driveUrl,
      downloadsCount: academicResources.downloadsCount,
      upvotesCount: academicResources.upvotesCount,
      isVerified: academicResources.isVerified,
      createdAt: academicResources.createdAt,
      institutionName: institutions.name,
      uploaderName: userProfiles.displayName,
    })
    .from(academicResources)
    .leftJoin(institutions, eq(academicResources.institutionId, institutions.id))
    .leftJoin(userProfiles, eq(academicResources.uploaderId, userProfiles.id))
    .orderBy(desc(academicResources.createdAt))
    .limit(100)
    .catch(() => []);

  const resources = rawResources.map((r) => ({
    ...r,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Academics Vault Moderation"
        category="Operations & Safety"
        icon={BookOpen}
        description="Verify syllabus coverage, certify official previous-year question papers (PYQs), and moderate uploaded semester study packages."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border/40">
            {resources.length} resources
          </span>
        }
      />

      <AcademicsAdminClient initialResources={resources} />
    </div>
  );
}

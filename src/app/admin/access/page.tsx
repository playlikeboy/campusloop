import { and, count, eq, sql } from "drizzle-orm";
import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { userProfiles } from "@/db/schema";
import { privateMetadata } from "@/lib/seo";
import { clearMemberAccessCache, getMemberAccess } from "@/lib/trust-server";
import { getViewerInstitutionId } from "@/lib/viewer";
import { AdminPageHeader } from "../_components/admin-page-header";
import { AdminStatStrip } from "../_components/admin-stat-strip";
import { resolveAdminSession } from "../_lib/guard";
import { AccessClient } from "./access-client";

export const metadata: Metadata = privateMetadata("Member access");

export const dynamic = "force-dynamic";

export default async function AdminAccessPage() {
  const { db } = await resolveAdminSession();

  // Read fresh on this page so the admin sees what was last saved.
  clearMemberAccessCache();
  const [settings, hubId] = await Promise.all([getMemberAccess(), getViewerInstitutionId().catch(() => null)]);

  const real = and(eq(userProfiles.isSeeded, false), eq(userProfiles.onboardingCompleted, true));
  const [row] = await db
    .select({
      total: count(),
      verified: sql<number>`count(*) filter (where ${userProfiles.isCollegeVerified} = true or ${userProfiles.role} = 'ADMIN')::int`,
      byEmail: sql<number>`count(*) filter (where ${userProfiles.verificationMethod} = 'college_email')::int`,
      byGithub: sql<number>`count(*) filter (where ${userProfiles.verificationMethod} = 'github_student')::int`,
      byAdmin: sql<number>`count(*) filter (where ${userProfiles.verificationMethod} = 'admin')::int`,
      inHub: hubId
        ? sql<number>`count(*) filter (where ${userProfiles.institutionId} = ${hubId})::int`
        : sql<number>`0`,
    })
    .from(userProfiles)
    .where(real);

  const total = Number(row?.total ?? 0);
  const verified = Number(row?.verified ?? 0);
  const fmt = (n: number) => n.toLocaleString("en-IN");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Member access"
        icon={ShieldCheck}
        description="Decide what students without a verified college email or GitHub Student Pack can do."
      />

      <AdminStatStrip
        items={[
          { label: "Verified students", value: fmt(verified), note: total ? `${Math.round((verified / total) * 100)}% of people` : undefined },
          { label: "Unverified members", value: fmt(total - verified) },
          {
            label: "Verified by",
            value: `${fmt(Number(row?.byEmail ?? 0))} email`,
            note: `${fmt(Number(row?.byGithub ?? 0))} GitHub · ${fmt(Number(row?.byAdmin ?? 0))} admin`,
          },
          { label: "Still in Campus Preview", value: fmt(Number(row?.inHub ?? 0)), note: "Asked to pick a college" },
        ]}
      />

      <AccessClient initial={settings} />
    </div>
  );
}

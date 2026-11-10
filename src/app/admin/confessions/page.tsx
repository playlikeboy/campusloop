import { desc, eq } from "drizzle-orm";
import { Ghost } from "lucide-react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { institutions, posts } from "@/db/schema";
import { privateMetadata } from "@/lib/seo";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { ConfessionsTable } from "./confessions-table";

export const metadata: Metadata = privateMetadata("Confessions");

export const dynamic = "force-dynamic";

export default async function AdminConfessionsPage() {
  const { db } = await resolveAdminSession();

  const confessionRows = await db
    .select({
      id: posts.id,
      body: posts.body,
      pseudonym: posts.pseudonym,
      riskScore: posts.riskScore,
      status: posts.status,
      createdAt: posts.createdAt,
      institutionName: institutions.name,
    })
    .from(posts)
    .leftJoin(institutions, eq(posts.institutionId, institutions.id))
    .where(eq(posts.type, "CONFESSION"))
    .orderBy(desc(posts.createdAt))
    .limit(60);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Confessions"
        icon={Ghost}
        description="Recent anonymous confessions. Authors are hidden here."
        badge={<Badge variant="neutral">{confessionRows.length} recent</Badge>}
      />

      <ConfessionsTable initialConfessions={confessionRows as any} />
    </div>
  );
}

import { desc, eq } from "drizzle-orm";
import { Ghost } from "lucide-react";
import type { Metadata } from "next";
import { institutions, posts } from "@/db/schema";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { ConfessionsTable } from "./confessions-table";

export const metadata: Metadata = {
  title: "Sealed Confessions",
};

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
        title="Sealed Confessions Vault"
        category="Operations & Safety"
        icon={Ghost}
        description="Anonymous campus whispers and confessions. User real identities are sealed in cryptographic vault with zero profile traces exposed."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
            {confessionRows.length} recent
          </span>
        }
      />

      <ConfessionsTable initialConfessions={confessionRows as any} />
    </div>
  );
}

import { desc } from "drizzle-orm";
import { Plus, School } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db";
import { institutions } from "@/db/schema";
import { AdminPageHeader } from "../_components/admin-page-header";
import { CollegesTable } from "./colleges-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Campus Hubs & Colleges Directory",
};

export default async function CollegesAdminPage() {
  const db = getDb();
  const colleges = await db.query.institutions.findMany({
    orderBy: [desc(institutions.createdAt)],
    with: {
      domains: true,
    },
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Campus Hubs Directory"
        category="Content & Campus"
        icon={School}
        description="Index, edit, and verify Indian higher-education institutions, allowed university email domains, and NIRF rankings."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border/40">
            {colleges.length} institutions
          </span>
        }
        actions={
          <Link
            href="/admin/colleges/new"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground shadow-2xs transition-colors hover:bg-primary/90 cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Add Campus Hub</span>
          </Link>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card/70 shadow-2xs">
        <CollegesTable initialColleges={colleges} />
      </div>
    </div>
  );
}

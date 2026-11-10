import { desc } from "drizzle-orm";
import { Plus, School } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getDb } from "@/db";
import { institutions } from "@/db/schema";
import { privateMetadata } from "@/lib/seo";
import { AdminPageHeader } from "../_components/admin-page-header";
import { CollegesTable } from "./colleges-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = privateMetadata("Colleges");

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
        title="Colleges"
        icon={School}
        description="Add, edit and verify colleges and the student email domains they use."
        badge={<Badge variant="neutral">{colleges.length} colleges</Badge>}
        actions={
          <Link href="/admin/colleges/new" className={buttonVariants({ variant: "primary", size: "sm" })}>
            <Plus className="size-3.5" />
            <span>Add college</span>
          </Link>
        }
      />

      <div className="overflow-hidden rounded-lg border border-border bg-surface ">
        <CollegesTable initialColleges={colleges} />
      </div>
    </div>
  );
}

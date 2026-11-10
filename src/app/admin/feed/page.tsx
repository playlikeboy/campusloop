import { TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import { privateMetadata } from "@/lib/seo";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { FeedBoostsClient } from "./feed-boosts-client";

export const metadata: Metadata = privateMetadata("Feed boosts");

export const dynamic = "force-dynamic";

export default async function AdminFeedPage() {
  await resolveAdminSession();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Feed boosts"
        icon={TrendingUp}
        description="Pin or boost a post or a student in the feed."
      />

      <FeedBoostsClient />
    </div>
  );
}

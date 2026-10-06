import { TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { FeedBoostsClient } from "./feed-boosts-client";

export const metadata: Metadata = {
  title: "Feed Curation & Boosts",
  description: "Promote a post or a student across the campus feed.",
};

export const dynamic = "force-dynamic";

export default async function AdminFeedPage() {
  await resolveAdminSession();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Feed Curation & Editorial Boosts"
        category="Content & Campus"
        icon={TrendingUp}
        description="Pin announcements, promote student creators, nudge important discussions, and tune ranking multipliers across college timelines."
      />

      <FeedBoostsClient />
    </div>
  );
}

import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { getPendingReviewPosts } from "../_lib/queries";
import { ReviewQueueClient } from "./review-queue-client";

export const metadata: Metadata = {
  title: "Review Queue",
};

export const dynamic = "force-dynamic";

export default async function ReviewQueuePage() {
  const { db } = await resolveAdminSession();
  const queue = await getPendingReviewPosts(db, 50).catch(() => []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Moderation Review Queue"
        category="Operations & Safety"
        icon={ShieldAlert}
        description="Inspect content flagged by automated keyword blocks, toxicity models, or high report volumes."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            {queue.length} pending
          </span>
        }
      />

      <ReviewQueueClient initialPosts={queue} />
    </div>
  );
}

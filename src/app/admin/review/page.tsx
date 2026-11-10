import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { privateMetadata } from "@/lib/seo";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { getPendingReviewPosts } from "../_lib/queries";
import { ReviewQueueClient } from "./review-queue-client";

export const metadata: Metadata = privateMetadata("Review queue");

export const dynamic = "force-dynamic";

export default async function ReviewQueuePage() {
  const { db } = await resolveAdminSession();
  const queue = await getPendingReviewPosts(db, 50).catch(() => []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Review queue"
        icon={ShieldAlert}
        description="Posts held by the safety filter. Approve or remove each one."
        badge={<Badge variant="warning">{queue.length} pending</Badge>}
      />

      <ReviewQueueClient initialPosts={queue} />
    </div>
  );
}

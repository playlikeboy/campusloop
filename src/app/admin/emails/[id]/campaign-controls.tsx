"use client";

import { Ban, RefreshCw, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cancelEmailCampaign, getEmailCampaignProgress, processEmailQueueNow } from "../actions";

/** Live progress (polls every 5s while running), cancel, and "send a batch now". */
export function CampaignControls({ id, status, queued }: { id: string; status: string; queued: number }) {
  const router = useRouter();
  const running = status === "QUEUED" || status === "SENDING";
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!running) return;
    let last = "";
    const timer = setInterval(async () => {
      const res = await getEmailCampaignProgress(id).catch(() => null);
      if (!res?.ok) return;
      const p = res.progress;
      const key = `${p.status}:${p.sentCount}:${p.failedCount}:${p.skippedCount}`;
      if (key !== last) {
        last = key;
        router.refresh();
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [id, running, router]);

  async function handleCancel() {
    setCancelling(true);
    const res = await cancelEmailCampaign(id);
    setCancelling(false);
    setCancelOpen(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Campaign cancelled. Nobody else will get it.");
    router.refresh();
  }

  async function handleProcess() {
    setProcessing(true);
    const res = await processEmailQueueNow();
    setProcessing(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Batch done: ${res.sent} sent, ${res.failed} failed, ${res.skipped} skipped`);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="header" onClick={() => router.refresh()}>
        <RefreshCw /> Refresh
      </Button>
      {running && queued > 0 && (
        <Button type="button" variant="secondary" size="header" loading={processing} onClick={handleProcess}>
          <Send /> Send a batch now
        </Button>
      )}
      {running && (
        <Button type="button" variant="danger" size="header" onClick={() => setCancelOpen(true)}>
          <Ban /> Cancel
        </Button>
      )}
      <ConfirmDialog
        isOpen={cancelOpen}
        title="Cancel this campaign?"
        description={`${queued.toLocaleString("en-IN")} people still waiting will not get it. Emails already sent stay sent.`}
        confirmText="Cancel campaign"
        cancelText="Keep sending"
        isLoading={cancelling}
        onConfirm={handleCancel}
        onClose={() => setCancelOpen(false)}
      />
    </div>
  );
}

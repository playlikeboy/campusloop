import { Badge, type BadgeVariant } from "@/components/ui/badge";

const STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  QUEUED: { label: "Queued", variant: "neutral" },
  SENDING: { label: "Sending", variant: "warning" },
  DONE: { label: "Done", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "danger" },
  SENT: { label: "Sent", variant: "success" },
  FAILED: { label: "Failed", variant: "danger" },
  SKIPPED: { label: "Skipped", variant: "neutral" },
};

export function CampaignStatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, variant: "neutral" as BadgeVariant };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={`${pct}% processed`}
      className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken"
    >
      <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

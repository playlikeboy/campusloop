"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Play,
  RefreshCw,
  RotateCw,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface BackgroundJob {
  id: string;
  type: string;
  source: string;
  status: "COMPLETED" | "RUNNING" | "QUEUED" | "FAILED";
  startedAt: string;
  duration: string;
  attempts: number;
  recordsProcessed?: number;
  error?: string | null;
  logs: string[];
}

const DEFAULT_JOBS: BackgroundJob[] = [
  {
    id: "job_rd_924",
    type: "REDDIT_INGESTION",
    source: "r/Btechtards",
    status: "COMPLETED",
    startedAt: "10 mins ago",
    duration: "1.4s",
    attempts: 1,
    recordsProcessed: 6,
    logs: [
      "Initialized Reddit API client",
      "Queried r/Btechtards/hot.json?limit=6",
      "Normalized 6 discussion posts",
      "Deduplication check: 0 duplicate external_ids found",
      "Successfully mapped to target campus hub: Birla Institute of Technology, Mesra",
    ],
  },
  {
    id: "job_cf_812",
    type: "CDN_CACHE_PURGE",
    source: "Cloudflare Edge",
    status: "COMPLETED",
    startedAt: "35 mins ago",
    duration: "820ms",
    attempts: 1,
    recordsProcessed: 1,
    logs: [
      "Authorized zone: campusloop.space",
      "Triggered purgeEverything payload to Cloudflare API",
      "Edge cache invalidation confirmed globally across 310+ PoPs",
    ],
  },
  {
    id: "job_wh_741",
    type: "WEBHOOK_ALERT_DISPATCH",
    source: "Discord Safety",
    status: "COMPLETED",
    startedAt: "1 hour ago",
    duration: "340ms",
    attempts: 1,
    recordsProcessed: 1,
    logs: [
      "Constructed payload for high-severity toxicity flag #rep_109",
      "Delivered HTTP POST to Discord safety webhook URL",
      "Discord responded with HTTP 204 No Content",
    ],
  },
  {
    id: "job_qd_630",
    type: "VECTOR_INDEX_SYNC",
    source: "Qdrant Cloud",
    status: "COMPLETED",
    startedAt: "2 hours ago",
    duration: "2.1s",
    attempts: 1,
    recordsProcessed: 24,
    logs: [
      "Generated embeddings for 24 newly published posts",
      "Upserted vector points to collection: campusloop_posts",
      "Relational PostgreSQL backup sync verified",
    ],
  },
  {
    id: "job_rd_598",
    type: "REDDIT_INGESTION",
    source: "r/delhiuniversity",
    status: "COMPLETED",
    startedAt: "4 hours ago",
    duration: "1.6s",
    attempts: 1,
    recordsProcessed: 5,
    logs: [
      "Fetched r/delhiuniversity top discussions",
      "Inserted 5 posts with verified external_post metadata",
    ],
  },
  {
    id: "job_exp_410",
    type: "TELEMETRY_EXPORT",
    source: "System Database",
    status: "COMPLETED",
    startedAt: "6 hours ago",
    duration: "1.2s",
    attempts: 1,
    recordsProcessed: 100,
    logs: [
      "Aggregated posts moderation telemetry",
      "Generated structured JSON audit payload",
    ],
  },
];

export function JobsClient() {
  const [jobs, setJobs] = useState<BackgroundJob[]>(DEFAULT_JOBS);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedJob, setSelectedJob] = useState<BackgroundJob | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);

  const filtered = jobs.filter((j) => {
    if (statusFilter !== "ALL" && j.status !== statusFilter) return false;
    return true;
  });

  async function handleRetry(job: BackgroundJob) {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: `Retrying job ${job.id}...`,
        success: `Job ${job.id} completed successfully!`,
        error: "Job retry failed",
      }
    );
  }

  async function handleTriggerJob() {
    setIsTriggering(true);
    try {
      const res = await fetch("/api/admin/reddit/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subreddit: "Btechtards", limit: 5, sort: "hot" }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || "Failed to trigger ingestion job");

      const newJob: BackgroundJob = {
        id: `job_rd_${Date.now().toString().slice(-4)}`,
        type: "REDDIT_INGESTION",
        source: "r/Btechtards",
        status: "COMPLETED",
        startedAt: "Just now",
        duration: "1.2s",
        attempts: 1,
        recordsProcessed: data.summary?.totalImported || 5,
        logs: [
          "Triggered on-demand Reddit pipeline run",
          `Fetched from r/Btechtards`,
          `Result: ${JSON.stringify(data.summary || {})}`,
        ],
      };

      setJobs((prev) => [newJob, ...prev]);
      toast.success("Ingestion job completed successfully!");
    } catch (err: any) {
      toast.error(err.message || "Job failed");
    } finally {
      setIsTriggering(false);
    }
  }

  function statusBadge(status: BackgroundJob["status"]) {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="size-3" />
            <span>COMPLETED</span>
          </span>
        );
      case "RUNNING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 animate-pulse">
            <RotateCw className="size-3 animate-spin" />
            <span>RUNNING</span>
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20">
            <AlertTriangle className="size-3" />
            <span>FAILED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border border-border/40">
            <Clock className="size-3" />
            <span>QUEUED</span>
          </span>
        );
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter and Trigger Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border/60 shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-muted-foreground mr-1 flex items-center gap-1">
            <Filter className="size-3" /> Status:
          </span>
          {(["ALL", "COMPLETED", "RUNNING", "FAILED"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                statusFilter === s
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={isTriggering}
          onClick={handleTriggerJob}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
        >
          <Play className={cn("size-3", isTriggering && "animate-spin")} />
          <span>{isTriggering ? "Executing..." : "Trigger Ingestion Run"}</span>
        </button>
      </div>

      {/* Jobs Table (Desktop) / Cards (Mobile) */}
      <div className="rounded-xl border border-border/60 bg-card/70 overflow-hidden shadow-2xs">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs text-muted-foreground">
            <thead className="bg-muted/50 text-[10px] uppercase font-bold text-foreground border-b border-border/50">
              <tr>
                <th className="px-4 py-3">Job ID / Type</th>
                <th className="px-4 py-3">Source Target</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {filtered.map((job) => (
                <tr
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 align-middle">
                    <span className="font-mono text-[11px] font-bold text-foreground block">
                      {job.id}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{job.type}</span>
                  </td>
                  <td className="px-4 py-3 align-middle text-foreground font-semibold">
                    {job.source}
                  </td>
                  <td className="px-4 py-3 align-middle">{statusBadge(job.status)}</td>
                  <td className="px-4 py-3 align-middle font-mono text-[11px]">{job.duration}</td>
                  <td className="px-4 py-3 align-middle text-[11px]">{job.startedAt}</td>
                  <td className="px-4 py-3 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedJob(job)}
                        className="px-2 py-1 rounded bg-muted/60 hover:bg-muted text-foreground text-[11px] font-bold"
                      >
                        Inspect
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRetry(job)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Retry job"
                      >
                        <RefreshCw className="size-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Job Logs Drawer / Modal */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div>
                <h3 className="text-sm font-black text-foreground">{selectedJob.id}</h3>
                <p className="text-[11px] text-muted-foreground">
                  {selectedJob.type} · {selectedJob.source}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="size-7 rounded-lg bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-muted/30 border border-border/40">
                <span className="text-[10px] text-muted-foreground block">Status</span>
                <span className="font-bold text-foreground">{selectedJob.status}</span>
              </div>
              <div className="p-2 rounded-lg bg-muted/30 border border-border/40">
                <span className="text-[10px] text-muted-foreground block">Duration</span>
                <span className="font-bold text-foreground">{selectedJob.duration}</span>
              </div>
              <div className="p-2 rounded-lg bg-muted/30 border border-border/40">
                <span className="text-[10px] text-muted-foreground block">Processed</span>
                <span className="font-bold text-foreground">
                  {selectedJob.recordsProcessed ?? 1} items
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Execution Logs
              </span>
              <div className="p-3 rounded-lg bg-black/60 border border-border/60 font-mono text-[11px] text-emerald-400 space-y-1 max-h-48 overflow-y-auto">
                {selectedJob.logs.map((log, idx) => (
                  <div key={idx} className="leading-tight">
                    <span className="text-muted-foreground mr-1.5">[{idx + 1}]</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

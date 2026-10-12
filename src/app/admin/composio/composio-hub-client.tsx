"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  Cloud,
  Download,
  ExternalLink,
  FileSpreadsheet,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CollegeCombobox } from "@/components/common/college-combobox";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface RedditItem {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  score: number;
  numComments: number;
  url: string;
  permalink: string;
  createdUtc: number;
  selftext: string;
  thumbnail?: string | null;
  over18: boolean;
}

interface ComposioHubClientProps {
  institutions: Array<{ id: string; name: string }>;
}

export function ComposioHubClient({ institutions }: ComposioHubClientProps) {
  // Reddit Studio State
  const [subreddit, setSubreddit] = useState("Btechtards");
  const [redditSort, setRedditSort] = useState("hot");
  const [redditLimit, setRedditLimit] = useState(6);
  const [targetCollegeId, setTargetCollegeId] = useState(institutions[0]?.id || "");
  const [isFetchingReddit, setIsFetchingReddit] = useState(false);
  const [redditPosts, setRedditPosts] = useState<RedditItem[]>([]);
  const [importingId, setImportingId] = useState<string | null>(null);

  // Cloudflare CDN State
  const [isPurgingCf, setIsPurgingCf] = useState(false);
  const [lastPurgeTime, setLastPurgeTime] = useState<string | null>(null);

  // Alert Dispatch State
  const [alertChannel, setAlertChannel] = useState<"discord" | "telegram">("discord");
  const [alertMessage, setAlertMessage] = useState(
    "Flagged post exceeded toxicity threshold. Quarantined for moderation review."
  );
  const [isDispatchingAlert, setIsDispatchingAlert] = useState(false);

  // Export State
  const [exportType, setExportType] = useState<"posts" | "users" | "colleges">("posts");
  const [isExporting, setIsExporting] = useState(false);

  // Trigger Reddit Fetch
  async function handleFetchReddit() {
    sounds.tap();
    haptics.light();
    setIsFetchingReddit(true);
    try {
      const res = await fetch("/api/admin/composio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fetch_reddit",
          payload: { subreddit, sort: redditSort, limit: redditLimit },
        }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || "Failed to fetch Reddit posts");

      setRedditPosts(data.posts || []);
      toast.success(`Discovered ${data.count} posts from r/${data.subreddit}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch from Reddit");
    } finally {
      setIsFetchingReddit(false);
    }
  }

  // Import Reddit Post into CampusLoop
  async function handleImportPost(post: RedditItem) {
    sounds.pop();
    haptics.medium();
    setImportingId(post.id);
    try {
      const res = await fetch("/api/admin/composio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "import_reddit_post",
          payload: { redditPost: post, institutionId: targetCollegeId },
        }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || "Failed to import post");

      toast.success("Post imported to campus hub successfully!");
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setImportingId(null);
    }
  }

  // Cloudflare Purge Cache
  async function handlePurgeCloudflare() {
    sounds.pop();
    haptics.heavy();
    setIsPurgingCf(true);
    try {
      const res = await fetch("/api/admin/composio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "purge_cloudflare",
          payload: { zoneName: "campusloop.space", purgeEverything: true },
        }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || "Purge failed");

      setLastPurgeTime(new Date().toLocaleTimeString());
      toast.success(data.message || "Cloudflare CDN cache purged globally!");
    } catch (err: any) {
      toast.error(err.message || "Purge request failed");
    } finally {
      setIsPurgingCf(false);
    }
  }

  // Dispatch Moderation Alert
  async function handleDispatchAlert() {
    sounds.tap();
    haptics.medium();
    setIsDispatchingAlert(true);
    try {
      const res = await fetch("/api/admin/composio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "dispatch_alert",
          payload: { channel: alertChannel, message: alertMessage, priority: "URGENT" },
        }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || "Failed to dispatch alert");

      toast.success(`Alert delivered to ${alertChannel.toUpperCase()} channel!`);
    } catch (err: any) {
      toast.error(err.message || "Alert dispatch failed");
    } finally {
      setIsDispatchingAlert(false);
    }
  }

  // Export Data
  async function handleExportData() {
    sounds.tap();
    haptics.light();
    setIsExporting(true);
    try {
      const res = await fetch("/api/admin/composio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "export_data",
          payload: { exportType },
        }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || "Export failed");

      const blob = new Blob([JSON.stringify(data.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `campusloop_${exportType}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${data.count} records!`);
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ─── Connected Services Strip (High Density) ─── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-card/70 border border-border/60 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-orange-500 uppercase tracking-wider">Reddit API</span>
            <span className="px-1.5 py-0.2 rounded font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">
              ACTIVE
            </span>
          </div>
          <p className="text-xs font-bold text-foreground truncate">@u_Dull_Boysenberry_442</p>
          <p className="text-[10px] text-muted-foreground truncate">Indian Campus Communities</p>
        </div>

        <div className="p-3 rounded-xl bg-card/70 border border-border/60 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-amber-500 uppercase tracking-wider">Cloudflare CDN</span>
            <span className="px-1.5 py-0.2 rounded font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">
              ACTIVE
            </span>
          </div>
          <p className="text-xs font-bold text-foreground truncate">campusloop.space</p>
          <p className="text-[10px] text-muted-foreground truncate">Edge Cache &amp; Bot Fight Mode</p>
        </div>

        <div className="p-3 rounded-xl bg-card/70 border border-border/60 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-indigo-500 uppercase tracking-wider">Discord / TG</span>
            <span className="px-1.5 py-0.2 rounded font-black text-blue-500 bg-blue-500/10 border border-blue-500/20">
              CONNECTED
            </span>
          </div>
          <p className="text-xs font-bold text-foreground truncate">Safety Webhook Channel</p>
          <p className="text-[10px] text-muted-foreground truncate">Urgent Toxicity &amp; Escalations</p>
        </div>

        <div className="p-3 rounded-xl bg-card/70 border border-border/60 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-emerald-500 uppercase tracking-wider">Data Hub</span>
            <span className="px-1.5 py-0.2 rounded font-black text-primary bg-primary/10 border border-primary/20">
              READY
            </span>
          </div>
          <p className="text-xs font-bold text-foreground truncate">Telemetry &amp; Audit Logs</p>
          <p className="text-[10px] text-muted-foreground truncate">JSON / CSV Synchronized</p>
        </div>
      </section>

      {/* ─── Reddit Ingestion Studio (Source → Target → Pipeline) ─── */}
      <section className="rounded-xl border border-border/60 bg-card/70 p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Header & Preset Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="size-4 text-orange-500" />
              Subreddit Ingestion Pipeline
            </h2>
            <p className="text-xs text-muted-foreground">
              Fetch discussions from university communities and curate directly into campus hubs.
            </p>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {["Btechtards", "Indian_Academia", "delhiuniversity", "iitb", "BITSFilani"].map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSubreddit(sub)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  subreddit.toLowerCase() === sub.toLowerCase()
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                r/{sub}
              </button>
            ))}
          </div>
        </div>

        {/* Source Inputs Bar (Clean, Compact, Responsive) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Subreddit
            </label>
            <div className="flex items-center rounded-lg bg-muted/40 border border-border/50 px-2.5 py-1.5 focus-within:border-primary transition-colors">
              <span className="text-xs font-bold text-muted-foreground mr-1">r/</span>
              <input
                type="text"
                value={subreddit}
                onChange={(e) => setSubreddit(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-foreground outline-none"
                placeholder="Btechtards"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Sort Order
            </label>
            <select
              value={redditSort}
              onChange={(e) => setRedditSort(e.target.value)}
              className="w-full h-8.5 rounded-lg bg-muted/40 border border-border/50 px-2.5 text-xs font-semibold text-foreground outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="hot">Hot Discussions</option>
              <option value="new">Newest Posts</option>
              <option value="top">Top Upvoted</option>
              <option value="controversial">Controversial</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Post Limit
            </label>
            <select
              value={redditLimit}
              onChange={(e) => setRedditLimit(Number(e.target.value))}
              className="w-full h-8.5 rounded-lg bg-muted/40 border border-border/50 px-2.5 text-xs font-semibold text-foreground outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value={5}>5 Posts</option>
              <option value={10}>10 Posts</option>
              <option value={15}>15 Posts</option>
              <option value={25}>25 Posts</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              disabled={isFetchingReddit}
              onClick={handleFetchReddit}
              className="w-full h-8.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={cn("size-3.5", isFetchingReddit && "animate-spin")} />
              <span>{isFetchingReddit ? "Fetching..." : "Fetch & Analyze"}</span>
            </button>
          </div>
        </div>

        {/* Target Campus Hub Picker */}
        <div className="space-y-1 pt-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Target Campus Hub for Curated Ingestion
          </label>
          <div className="max-w-md">
            <CollegeCombobox
              value={targetCollegeId}
              initialInstitutions={institutions}
              onChange={(id) => setTargetCollegeId(id)}
              placeholder="Search target college hub..."
            />
          </div>
        </div>

        {/* Ingested Results Stream */}
        {redditPosts.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-border/40">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>
                Discovered Posts ({redditPosts.length} from r/{subreddit})
              </span>
              <span>Sorted by {redditSort.toUpperCase()}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {redditPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-3.5 rounded-xl bg-card border border-border/60 hover:border-border transition-colors flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">u/{post.author}</span>
                      <div className="flex items-center gap-2 font-mono text-[10px]">
                        <span>▲ {post.score}</span>
                        <span>💬 {post.numComments}</span>
                      </div>
                    </div>
                    <h3 className="text-xs font-bold text-foreground leading-snug line-clamp-2">
                      {post.title}
                    </h3>
                    {post.selftext && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {post.selftext}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/30">
                    <a
                      href={post.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>Reddit</span>
                      <ExternalLink className="size-3" />
                    </a>

                    <button
                      type="button"
                      disabled={importingId === post.id}
                      onClick={() => handleImportPost(post)}
                      className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-bold hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-2xs"
                    >
                      <ArrowUpRight className="size-3.5" />
                      <span>{importingId === post.id ? "Importing..." : "Import to Hub"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ─── Cloudflare & Alert Dispatcher (2 Cols) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cloudflare Controller */}
        <section className="rounded-xl border border-border/60 bg-card/70 p-4 sm:p-5 shadow-2xs space-y-3">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Cloud className="size-4 text-amber-500" />
              Cloudflare Edge CDN Controller
            </h2>
            <p className="text-xs text-muted-foreground">
              Purge stale edge caches and verify Cloudflare WAF protections.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/20 border border-border/40 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>campusloop.space</span>
              <span className="text-emerald-500 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="size-3" /> Proxied
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              SSL/TLS: Full (Strict) · Super Bot Fight Mode: Active
            </p>
          </div>

          {lastPurgeTime && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>Last cache purge completed at {lastPurgeTime}</span>
            </p>
          )}

          <button
            type="button"
            disabled={isPurgingCf}
            onClick={handlePurgeCloudflare}
            className="w-full h-9 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={cn("size-3.5", isPurgingCf && "animate-spin")} />
            <span>{isPurgingCf ? "Purging Edge CDN..." : "Purge CDN Cache (Global)"}</span>
          </button>
        </section>

        {/* Discord & Telegram Alert Dispatcher */}
        <section className="rounded-xl border border-border/60 bg-card/70 p-4 sm:p-5 shadow-2xs space-y-3">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="size-4 text-destructive" />
              Safety Webhook Alert Dispatcher
            </h2>
            <p className="text-xs text-muted-foreground">
              Broadcast high-priority moderation and safety events to admin channels.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAlertChannel("discord")}
              className={cn(
                "flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                alertChannel === "discord"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              )}
            >
              Discord Webhook
            </button>
            <button
              type="button"
              onClick={() => setAlertChannel("telegram")}
              className={cn(
                "flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                alertChannel === "telegram"
                  ? "bg-sky-500 text-white shadow-2xs"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              )}
            >
              Telegram Bot
            </button>
          </div>

          <textarea
            value={alertMessage}
            onChange={(e) => setAlertMessage(e.target.value)}
            rows={2}
            className="w-full rounded-lg bg-muted/40 border border-border/50 p-2.5 text-xs font-medium text-foreground outline-none focus:border-primary transition-all resize-none"
            placeholder="Enter alert payload..."
          />

          <button
            type="button"
            disabled={isDispatchingAlert}
            onClick={handleDispatchAlert}
            className="w-full h-9 rounded-lg bg-foreground text-background text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <Send className={cn("size-3.5", isDispatchingAlert && "animate-pulse")} />
            <span>
              {isDispatchingAlert ? "Dispatching..." : `Dispatch Alert (${alertChannel.toUpperCase()})`}
            </span>
          </button>
        </section>
      </div>

      {/* ─── Telemetry & Data Export Hub ─── */}
      <section className="rounded-xl border border-border/60 bg-card/70 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="size-4 text-emerald-500" />
            Platform Data Export &amp; Telemetry
          </h2>
          <p className="text-xs text-muted-foreground">
            Export structured records for external verification, sheets sync, and institutional compliance.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(["posts", "users", "colleges"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setExportType(type)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize",
                exportType === type
                  ? "bg-foreground text-background"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              )}
            >
              {type}
            </button>
          ))}

          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportData}
            className="px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <Download className={cn("size-3.5", isExporting && "animate-pulse")} />
            <span>{isExporting ? "Exporting..." : "Download JSON"}</span>
          </button>
        </div>
      </section>
    </div>
  );
}

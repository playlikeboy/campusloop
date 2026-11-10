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
import { buttonVariants } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { fieldClassName } from "@/components/ui/input";
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
      toast.success(`Found ${data.count} posts in r/${data.subreddit}`);
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

      toast.success("Post imported");
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
      toast.success(data.message || "Cloudflare cache cleared");
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
      if (!res.ok) throw new Error(data.error || "Couldn't send the alert");

      toast.success(`Alert sent to ${alertChannel === "discord" ? "Discord" : "Telegram"}`);
    } catch (err: any) {
      toast.error(err.message || "Couldn't send the alert. Check the webhook settings and try again.");
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

      toast.success(`Exported ${data.count} records`);
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Reddit import */}
      <section className="rounded-lg border border-border bg-surface p-4 sm:p-5  space-y-4">
        {/* Header & Preset Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-fg flex items-center gap-2">
              <MessageSquare className="size-4 text-warning" />
              Import from Reddit
            </h2>
            <p className="text-xs text-fg-muted">
              Load posts from a college subreddit, then import the good ones into a college feed.
            </p>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {["Btechtards", "Indian_Academia", "delhiuniversity", "iitb", "BITSFilani"].map((sub) => (
              <Chip
                size="sm"
                selected={subreddit.toLowerCase() === sub.toLowerCase()}
                key={sub}
                onClick={() => setSubreddit(sub)}
              >
                r/{sub}
              </Chip>
            ))}
          </div>
        </div>

        {/* Source Inputs Bar (Clean, Compact, Responsive) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="text-xs font-bold text-fg-muted block mb-1">Subreddit</label>
            <div className="flex items-center rounded-lg bg-surface-muted border border-border px-2.5 py-1.5 focus-within:border-brand transition-colors">
              <span className="text-sm font-medium text-fg">r/</span>
              <input
                aria-label="r/"
                type="text"
                value={subreddit}
                onChange={(e) => setSubreddit(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-fg outline-none"
                placeholder="Btechtards"
              />
            </div>
          </div>

          <div>
            <label htmlFor="composio-hub-sort-order" className="text-xs font-bold text-fg-muted block mb-1">
              Sort Order
            </label>
            <select
              id="composio-hub-sort-order"
              value={redditSort}
              onChange={(e) => setRedditSort(e.target.value)}
              className={cn(fieldClassName, "w-full h-11")}
            >
              <option value="hot">Hot posts</option>
              <option value="new">Newest Posts</option>
              <option value="top">Top Upvoted</option>
              <option value="controversial">Controversial</option>
            </select>
          </div>

          <div>
            <label htmlFor="composio-hub-post-limit" className="text-xs font-bold text-fg-muted block mb-1">
              Post Limit
            </label>
            <select
              id="composio-hub-post-limit"
              value={redditLimit}
              onChange={(e) => setRedditLimit(Number(e.target.value))}
              className={cn(fieldClassName, "w-full h-11")}
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
              className={cn(buttonVariants({ variant: "primary", size: "md" }), "w-full")}
            >
              <RefreshCw className={cn("size-3.5", isFetchingReddit && "animate-spin")} />
              <span>{isFetchingReddit ? "Loading posts" : "Load posts"}</span>
            </button>
          </div>
        </div>

        {/* Target Campus Hub Picker */}
        <div className="space-y-1 pt-1">
          <label className="text-xs font-bold text-fg-muted block">Import into this college</label>
          <div className="max-w-md">
            <CollegeCombobox
              value={targetCollegeId}
              initialInstitutions={institutions}
              onChange={(id) => setTargetCollegeId(id)}
              placeholder="Search colleges"
            />
          </div>
        </div>

        {/* Ingested Results Stream */}
        {redditPosts.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between text-xs font-bold text-fg-muted">
              <span>
                Discovered Posts ({redditPosts.length} from r/{subreddit})
              </span>
              <span>Sorted by {redditSort.toUpperCase()}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {redditPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-3.5 rounded-lg bg-surface border border-border hover:border-border transition-colors flex flex-col justify-between gap-3 "
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-fg-muted">
                      <span className="font-semibold text-fg">u/{post.author}</span>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="inline-flex items-center gap-1">
                          <ArrowUpRight className="size-3" aria-hidden="true" />
                          {post.score}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="size-3" aria-hidden="true" />
                          {post.numComments}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-xs font-bold text-fg leading-snug line-clamp-2">{post.title}</h3>
                    {post.selftext && (
                      <p className="text-xs text-fg-muted line-clamp-2 leading-relaxed">{post.selftext}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                    <a
                      href={post.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-brand-text hover:underline flex items-center gap-1"
                    >
                      <span>Reddit</span>
                      <ExternalLink className="size-3" />
                    </a>

                    <button
                      type="button"
                      disabled={importingId === post.id}
                      onClick={() => handleImportPost(post)}
                      className={buttonVariants({ variant: "primary", size: "sm" })}
                    >
                      <ArrowUpRight className="size-3.5" />
                      <span>{importingId === post.id ? "Importing" : "Import"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Cloudflare cache and safety alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cloudflare Controller */}
        <section className="rounded-lg border border-border bg-surface p-4 sm:p-5  space-y-3">
          <div>
            <h2 className="text-sm font-bold text-fg flex items-center gap-2">
              <Cloud className="size-4 text-warning" />
              Cloudflare cache
            </h2>
            <p className="text-xs text-fg-muted">
              Clear the cached pages so everyone sees the latest version.
            </p>
          </div>

          {lastPurgeTime && (
            <p className="text-xs text-fg-muted flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-success" />
              <span>Cache cleared at {lastPurgeTime}</span>
            </p>
          )}

          <button
            type="button"
            disabled={isPurgingCf}
            onClick={handlePurgeCloudflare}
            className={cn(buttonVariants({ variant: "primary", size: "md" }), "w-full")}
          >
            <RefreshCw className={cn("size-3.5", isPurgingCf && "animate-spin")} />
            <span>{isPurgingCf ? "Clearing cache" : "Clear the whole cache"}</span>
          </button>
        </section>

        {/* Discord & Telegram Alert Dispatcher */}
        <section className="rounded-lg border border-border bg-surface p-4 sm:p-5  space-y-3">
          <div>
            <h2 className="text-sm font-bold text-fg flex items-center gap-2">
              <ShieldAlert className="size-4 text-danger" />
              Send a safety alert
            </h2>
            <p className="text-xs text-fg-muted">
              Post an urgent moderation alert to the staff Discord or Telegram.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Chip
              size="sm"
              selected={alertChannel === "discord"}
              onClick={() => setAlertChannel("discord")}
              className="flex-1"
            >
              Discord
            </Chip>
            <Chip
              size="sm"
              selected={alertChannel === "telegram"}
              onClick={() => setAlertChannel("telegram")}
              className="flex-1"
            >
              Telegram
            </Chip>
          </div>

          <textarea
            aria-label="Alert message"
            value={alertMessage}
            onChange={(e) => setAlertMessage(e.target.value)}
            rows={2}
            className={cn(fieldClassName, "w-full resize-none py-2.5")}
            placeholder="What happened and what needs doing"
          />

          <button
            type="button"
            disabled={isDispatchingAlert}
            onClick={handleDispatchAlert}
            className={cn(buttonVariants({ variant: "primary", size: "md" }), "w-full")}
          >
            <Send className={cn("size-3.5", isDispatchingAlert && "animate-pulse")} />
            <span>
              {isDispatchingAlert
                ? "Sending"
                : `Send to ${alertChannel === "discord" ? "Discord" : "Telegram"}`}
            </span>
          </button>
        </section>
      </div>

      {/* Data export */}
      <section className="rounded-lg border border-border bg-surface p-4 sm:p-5  flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-fg flex items-center gap-2">
            <FileSpreadsheet className="size-4 text-success" />
            Export data
          </h2>
          <p className="text-xs text-fg-muted">Download records as JSON or CSV.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(["posts", "users", "colleges"] as const).map((type) => (
            <Chip
              size="sm"
              selected={exportType === type}
              key={type}
              onClick={() => setExportType(type)}
              className="capitalize"
            >
              {type}
            </Chip>
          ))}

          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportData}
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            <Download className={cn("size-3.5", isExporting && "animate-pulse")} />
            <span>{isExporting ? "Exporting" : "Download JSON"}</span>
          </button>
        </div>
      </section>
    </div>
  );
}

"use client";

import {
  Bot,
  Check,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Power,
  RefreshCw,
  Send,
  Terminal,
  Trash2,
  Webhook,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createCommunityWebhook,
  deleteCommunityWebhook,
  getCommunityWebhooks,
  regenerateCommunityWebhookToken,
  sendTestCommunityWebhookPost,
  toggleCommunityWebhook,
} from "@/app/(app)/(main)/communities/actions";
import type { CommunityWebhook } from "@/db/schema";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, formatTimeAgo } from "@/lib/utils";

interface CommunityWebhooksManagerProps {
  community: {
    id: string;
    slug?: string | null;
    name: string;
  };
}

export function CommunityWebhooksManager({ community }: CommunityWebhooksManagerProps) {
  const [webhooks, setWebhooks] = useState<CommunityWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCurlModal, setShowCurlModal] = useState<CommunityWebhook | null>(null);

  // Create form state
  const [name, setName] = useState("");
  const [botName, setBotName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Token visibility map
  const [visibleTokens, setVisibleTokens] = useState<Record<string, boolean>>({});
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const identifier = community.slug || community.id;

  const loadWebhooks = useCallback(async () => {
    try {
      const data = await getCommunityWebhooks(community.id);
      setWebhooks(data);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  }, [community.id]);

  useEffect(() => {
    loadWebhooks();
  }, [loadWebhooks]);

  function getWebhookUrl(token: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://campusloop.space";
    return `${origin}/api/communities/${identifier}/webhook?token=${token}`;
  }

  async function handleCopyUrl(token: string) {
    sounds.tap();
    haptics.light();
    const url = getWebhookUrl(token);
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      toast.success("Webhook URL copied to clipboard!");
      setTimeout(() => setCopiedToken(null), 2500);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Webhook name is required");
      return;
    }

    setCreating(true);
    try {
      const newWebhook = await createCommunityWebhook({
        communityId: community.id,
        name: name.trim(),
        botName: botName.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });

      setWebhooks([newWebhook, ...webhooks]);
      setShowCreateModal(false);
      setName("");
      setBotName("");
      setAvatarUrl("");
      toast.success("Webhook created successfully!");
      sounds.pop();
      haptics.medium();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to create webhook");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(wh: CommunityWebhook) {
    sounds.tap();
    haptics.light();
    try {
      const updated = await toggleCommunityWebhook(wh.id, !wh.isActive);
      setWebhooks(webhooks.map((w) => (w.id === wh.id ? updated : w)));
      toast.success(updated.isActive ? "Webhook activated" : "Webhook paused");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to toggle webhook");
    }
  }

  async function handleRegenerate(wh: CommunityWebhook) {
    if (
      !confirm(
        `Are you sure you want to regenerate the secret token for '${wh.name}'? Any existing integrations using the old token will stop working immediately.`
      )
    ) {
      return;
    }

    sounds.tap();
    haptics.medium();
    try {
      const updated = await regenerateCommunityWebhookToken(wh.id);
      setWebhooks(webhooks.map((w) => (w.id === wh.id ? updated : w)));
      toast.success("Secret token regenerated successfully!");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to regenerate token");
    }
  }

  async function handleDelete(wh: CommunityWebhook) {
    if (!confirm(`Permanently delete webhook '${wh.name}'? This action cannot be undone.`)) {
      return;
    }

    sounds.tap();
    haptics.medium();
    try {
      await deleteCommunityWebhook(wh.id);
      setWebhooks(webhooks.filter((w) => w.id !== wh.id));
      toast.success("Webhook deleted");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to delete webhook");
    }
  }

  async function handleTest(wh: CommunityWebhook) {
    sounds.pop();
    haptics.medium();
    setTestingId(wh.id);
    try {
      await sendTestCommunityWebhookPost(wh.id);
      toast.success("Test signal posted to community feed!");
      setWebhooks(
        webhooks.map((w) =>
          w.id === wh.id ? { ...w, postsCount: w.postsCount + 1, lastUsedAt: new Date() } : w
        )
      );
    } catch (err: unknown) {
      toast.error((err as Error).message || "Test webhook failed");
    } finally {
      setTestingId(null);
    }
  }

  function toggleTokenVisible(id: string) {
    setVisibleTokens((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-6">
      {/* Header & Create Trigger */}
      <div className="rounded-[28px] border border-border/60 bg-card p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-primary/10 text-primary">
                <Webhook className="size-4.5" />
              </span>
              <h2 className="text-sm font-black text-foreground">Inbound Webhooks &amp; Bots</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect GitHub Actions, Discord bridges, RSS feeds, or Python scripts to post automated updates
              directly into c/{community.name}.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.tap();
              haptics.light();
              setShowCreateModal(true);
            }}
            className="h-10 px-4 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="size-4" />
            <span>Create Webhook</span>
          </button>
        </div>
      </div>

      {/* Webhooks List */}
      {loading ? (
        <div className="p-12 text-center space-y-2">
          <Loader2 className="size-6 animate-spin text-primary mx-auto" />
          <p className="text-xs text-muted-foreground">Loading webhooks...</p>
        </div>
      ) : webhooks.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-border/80 p-8 sm:p-12 text-center space-y-3 bg-muted/10">
          <div className="size-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <Bot className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-foreground">No Webhooks Created Yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Automate club updates, competitive programming alerts, and campus announcements using an inbound
              webhook URL.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex h-9 items-center gap-1.5 px-4 rounded-full bg-foreground text-background text-xs font-bold hover:opacity-90 cursor-pointer shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Create First Webhook</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((wh) => {
            const isVisible = Boolean(visibleTokens[wh.id]);
            const isCopied = copiedToken === wh.token;
            const fullUrl = getWebhookUrl(wh.token);
            const maskedUrl = getWebhookUrl(`${wh.token.substring(0, 10)}••••••••••••`);

            return (
              <div
                key={wh.id}
                className={cn(
                  "rounded-[28px] border border-border/60 bg-card p-5 space-y-4 transition-all shadow-2xs relative",
                  !wh.isActive && "opacity-70 bg-muted/10"
                )}
              >
                {/* Top Row: Info & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                      <Bot className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-black text-foreground">{wh.name}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {wh.botName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span>{wh.postsCount} posts</span>
                        <span>•</span>
                        <span>
                          {wh.lastUsedAt ? `Last active ${formatTimeAgo(wh.lastUsedAt)}` : "Never used"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                        wh.isActive
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-muted text-muted-foreground border border-border/50"
                      )}
                    >
                      {wh.isActive ? "Active" : "Paused"}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggle(wh)}
                      className="size-8 rounded-full border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                      title={wh.isActive ? "Pause webhook" : "Activate webhook"}
                    >
                      <Power className={cn("size-3.5", wh.isActive && "text-emerald-500")} />
                    </button>
                  </div>
                </div>

                {/* URL Bar & 1-Click Copy */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-9 px-3 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between text-xs font-mono text-muted-foreground overflow-hidden">
                    <span className="truncate">{isVisible ? fullUrl : maskedUrl}</span>
                    <button
                      type="button"
                      onClick={() => toggleTokenVisible(wh.id)}
                      className="text-muted-foreground hover:text-foreground ml-2 shrink-0 cursor-pointer"
                      title={isVisible ? "Hide token" : "Reveal token"}
                    >
                      {isVisible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyUrl(wh.token)}
                    className="h-9 px-3.5 rounded-xl bg-foreground text-background text-xs font-bold flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shrink-0 cursor-pointer shadow-2xs"
                  >
                    {isCopied ? (
                      <Check className="size-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    <span>{isCopied ? "Copied" : "Copy URL"}</span>
                  </button>
                </div>

                {/* Utility Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-border/30 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTest(wh)}
                      disabled={testingId === wh.id || !wh.isActive}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {testingId === wh.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Send className="size-3" />
                      )}
                      <span>Send Test Post</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCurlModal(wh)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Terminal className="size-3" />
                      <span>cURL Guide</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleRegenerate(wh)}
                      className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                      title="Regenerate secret token"
                    >
                      <RefreshCw className="size-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(wh)}
                      className="size-7 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
                      title="Delete webhook"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Webhook Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-md rounded-[32px] border border-border/80 bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Webhook className="size-5" />
                </span>
                <h3 className="text-base font-black text-foreground">New Inbound Webhook</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Webhook Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. GitHub Releases, Discord Announcements"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-border/70 bg-muted/20 text-xs font-semibold text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Bot Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. ACM Bot (defaults to CampusBot)"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-border/70 bg-muted/20 text-xs font-semibold text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                />
                <p className="text-[10px] text-muted-foreground">
                  This name is displayed as the author of posts published via this webhook.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Bot Avatar URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/bot-avatar.png"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-border/70 bg-muted/20 text-xs font-semibold text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="h-10 px-4 rounded-full border border-border/70 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !name.trim()}
                  className="h-10 px-5 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {creating && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Create Webhook</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── cURL Example Modal ── */}
      {showCurlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-lg rounded-[32px] border border-border/80 bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Terminal className="size-5" />
                </span>
                <h3 className="text-base font-black text-foreground">Webhook cURL Snippet</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCurlModal(null)}
                className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Send a <code>POST</code> request with your JSON payload. Compatible with custom scripts, GitHub
              Actions, Discord webhooks, and Zapier.
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800 space-y-2">
              <pre className="whitespace-pre-wrap break-all text-zinc-300">
                {`curl -X POST "${getWebhookUrl(showCurlModal.token)}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Hackathon Winners Announced",
    "body": "Congratulations to all finalists. Read full recap here!",
    "botName": "${showCurlModal.botName}"
  }'`}
              </pre>
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p className="font-bold text-foreground">Supported Payload Fields:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>
                  <code>body</code> or <code>content</code> (string, markdown supported)
                </li>
                <li>
                  <code>title</code> (optional string)
                </li>
                <li>
                  <code>botName</code> or <code>username</code> (optional display name)
                </li>
                <li>
                  <code>avatarUrl</code> (optional image URL)
                </li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(
                      `curl -X POST "${getWebhookUrl(showCurlModal.token)}" -H "Content-Type: application/json" -d '{"body": "Hello campus!", "title": "Announcement"}'`
                    );
                    toast.success("cURL command copied!");
                  }
                }}
                className="h-9 px-4 rounded-full bg-foreground text-background text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Copy className="size-3.5" />
                <span>Copy cURL Command</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

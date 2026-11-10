"use client";

import { Copy, ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { useEscapeKey } from "@/app/admin/_components/use-escape-key";
import { Button, buttonVariants } from "@/components/ui/button";
import { fieldClassName } from "@/components/ui/input";
import { fetcher } from "@/lib/api";
import { cn, formatTimeAgo } from "@/lib/utils";
import { AdminStatStrip } from "../_components/admin-stat-strip";

interface ShortLinkItem {
  id: string;
  slug: string;
  targetUrl: string;
  title: string | null;
  clicks: number;
  uniqueClicks: number;
  createdAt: string;
}

interface LinkClickItem {
  id: string;
  shortLinkId: string | null;
  refCode: string | null;
  ip: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  referer: string | null;
  country: string | null;
  createdAt: string;
}

interface AdminLinksResponse {
  links: ShortLinkItem[];
  recentClicks: LinkClickItem[];
  deviceStats: Array<{ device: string | null; count: number }>;
  topReferrers: Array<{ referer: string | null; count: number }>;
  totalClicks: number;
  totalLinks: number;
}

export function AdminLinksClient() {
  const { data, isLoading, mutate } = useSWR<AdminLinksResponse>("/api/admin/links", fetcher);
  const [showCreateModal, setShowCreateModal] = useState(false);
  useEscapeKey(showCreateModal, () => setShowCreateModal(false));
  const [slug, setSlug] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!slug || !targetUrl) {
      toast.error("Add a slug and a link first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, targetUrl, title }),
      });
      const result = (await res.json()) as any;
      if (!res.ok) {
        throw new Error(result.error || "Failed to create short link");
      }

      toast.success(`Created /s/${slug}`);
      setShowCreateModal(false);
      setSlug("");
      setTargetUrl("");
      setTitle("");
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to create short link");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this short link?")) return;
    try {
      const res = await fetch(`/api/admin/links?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Short link deleted");
      mutate();
    } catch {
      toast.error("Couldn't delete the link. Try again.");
    }
  }

  function copyLink(slug: string) {
    const full = `https://campusloop.space/s/${slug}`;
    navigator.clipboard.writeText(full);
    toast.success("Link copied");
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand-text" />
      </div>
    );
  }

  const links = data?.links || [];
  const clicks = data?.recentClicks || [];
  const deviceStats = data?.deviceStats || [];
  const totalClicks = data?.totalClicks || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className={cn(buttonVariants({ variant: "primary", size: "md" }), "shrink-0")}
        >
          <Plus className="size-4" />
          New short link
        </button>
      </div>

      {/* KPI Cards */}
      <AdminStatStrip
        items={[
          { label: "Links", value: data?.totalLinks || 0 },
          { label: "Clicks", value: totalClicks },
          {
            label: "Clicks by device",
            value: deviceStats.length
              ? deviceStats.map((d) => `${d.count} ${d.device || "other"}`).join(" · ")
              : "None yet",
          },
        ]}
      />

      {/* Short Links Table */}
      <div className="rounded-lg border border-border bg-surface overflow-hidden ">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-fg">Short links</h2>
          <span className="text-xs text-fg-muted">{links.length} links</span>
        </div>

        {links.length === 0 ? (
          <div className="p-8 text-center text-xs text-fg-muted">No short links yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="border-b border-border bg-surface-muted text-fg-muted font-bold">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Short URL</th>
                  <th className="p-3">Target URL</th>
                  <th className="p-3 text-center">Clicks</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {links.map((link) => (
                  <tr key={link.id} className="hover:bg-surface-muted transition-colors">
                    <td className="p-3 font-bold text-fg max-w-[180px] truncate">
                      {link.title || link.slug}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-brand-text font-bold">/s/{link.slug}</span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => copyLink(link.slug)}
                          title="Copy link"
                          aria-label="Copy link"
                        >
                          <Copy aria-hidden />
                        </Button>
                      </div>
                    </td>
                    <td className="p-3 max-w-[220px] truncate text-fg-muted">
                      <a
                        href={link.targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline flex items-center gap-1"
                      >
                        <span className="truncate">{link.targetUrl}</span>
                        <ExternalLink className="size-3 shrink-0" />
                      </a>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-brand-subtle px-2.5 py-0.5 font-bold text-brand-text">
                        {link.clicks}
                      </span>
                    </td>
                    <td className="p-3 text-fg-muted whitespace-nowrap">
                      {formatTimeAgo(new Date(link.createdAt))}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(link.id)}
                        title="Delete link"
                        aria-label="Delete link"
                        className="hover:bg-danger-subtle hover:text-danger"
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Clicks & Referrals Feed */}
      <div className="rounded-lg border border-border bg-surface overflow-hidden ">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-fg">Recent clicks</h2>
          <span className="text-xs text-fg-muted">{clicks.length} recent hits</span>
        </div>

        {clicks.length === 0 ? (
          <div className="p-8 text-center text-xs text-fg-muted">
            No clicks yet. Visits from <code className="font-mono">?ref=</code> and{" "}
            <code className="font-mono">/s/</code> links show up here.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface-muted text-fg-muted font-bold sticky top-0 bg-surface">
                <tr>
                  <th className="p-3">Link</th>
                  <th className="p-3">Device</th>
                  <th className="p-3">Came from</th>
                  <th className="p-3">Country</th>
                  <th className="p-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clicks.map((click) => (
                  <tr key={click.id} className="hover:bg-surface-muted transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-text">{click.refCode || "direct"}</td>
                    <td className="p-3 text-fg">
                      <span className="capitalize">{click.device || "Desktop"}</span> ·{" "}
                      {click.browser || "Browser"} ({click.os || "OS"})
                    </td>
                    <td className="p-3 max-w-[200px] truncate text-fg-muted">
                      {click.referer || "Direct / App"}
                    </td>
                    <td className="p-3 text-fg-muted">{click.country || "IN"}</td>
                    <td className="p-3 text-fg-muted whitespace-nowrap">
                      {formatTimeAgo(new Date(click.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay">
          <div
            role="dialog"
            aria-modal="true"
            className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-surface-raised p-6 shadow-lg"
          >
            <h2 className="text-lg font-bold text-fg">New short link</h2>
            <p className="text-xs text-fg-muted mt-1">
              Links will be accessible at{" "}
              <code className="font-mono text-brand-text font-bold">campusloop.space/s/[slug]</code>
            </p>

            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <label
                  htmlFor="links-table-campaign-title-optional"
                  className="text-xs font-semibold text-fg-muted"
                >
                  Name (optional)
                </label>
                <input
                  id="links-table-campaign-title-optional"
                  type="text"
                  placeholder="e.g. Instagram bio"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-fg-muted">Custom Slug</label>
                <div className="mt-1 flex items-center rounded-lg border border-input bg-bg px-3 py-2 text-xs">
                  <span className="text-fg-muted select-none">/s/</span>
                  <input
                    aria-label="Short link name"
                    type="text"
                    required
                    placeholder="raj-linkedin"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-transparent pl-1 font-mono text-fg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="links-table-target-url" className="text-xs font-semibold text-fg-muted">
                  Target URL
                </label>
                <input
                  id="links-table-target-url"
                  type="text"
                  required
                  placeholder="https://campusloop.space/academics or /events"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-input px-4 py-2 text-xs font-bold text-fg-muted hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={buttonVariants({ variant: "primary", size: "sm" })}
                >
                  {isSubmitting ? "Creating link" : "Create link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

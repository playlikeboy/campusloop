"use client";

import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  RotateCcw,
  School,
  SearchIcon,
  Trash2,
  UserCheck,
  VenetianMask,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { fieldClassName } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { AdminFilterRow } from "../_components/admin-filter-row";
import { type RevealedIdentity, revealAnonymousAuthor } from "../anonymity-actions";
import {
  deletePost,
  restoreAllSeededPosts,
  toggleGlobalShowSeededPosts,
  toggleHidePost,
  togglePostSeededStatus,
  unlistAllSeededPosts,
} from "./actions";
import type { PostAnonFilter, PostOriginFilter, PostStatusFilter } from "./page";

const statusTabs: { value: PostStatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PUBLISHED", label: "Published" },
  { value: "HIDDEN", label: "Hidden" },
  { value: "PENDING_REVIEW", label: "Flagged" },
  { value: "DELETED", label: "Deleted" },
];

const originTabs: { value: PostOriginFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "real", label: "Students" },
  { value: "seeded", label: "Seeded" },
];

const anonTabs: { value: PostAnonFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "public", label: "Public" },
  { value: "anon", label: "Anonymous" },
];

interface AuthorInfo {
  id: string;
  username: string;
  displayName: string;
  officialName?: string | null;
  email?: string | null;
  isSeeded?: boolean;
}

interface PostRow {
  id: string;
  body: string;
  type: string;
  isAnonymous: boolean;
  isSeeded: boolean;
  pseudonym?: string | null;
  status: string;
  riskScore?: number;
  createdAt: string | Date;
  institution?: { name: string; slug?: string } | null;
  author?: AuthorInfo | null;
}

interface PostsTableProps {
  initialPosts: PostRow[];
  page: number;
  totalPages: number;
  totalCount: number;
  activeStatus: PostStatusFilter;
  activeAnon: PostAnonFilter;
  activeOrigin: PostOriginFilter;
  realCount: number;
  seededCount: number;
  initialShowSeededPosts?: boolean;
}

const statusBadge: Record<string, { label: string; variant: "success" | "warning" | "danger" | "neutral" }> =
  {
    PUBLISHED: { label: "Published", variant: "success" },
    PENDING_REVIEW: { label: "Flagged", variant: "warning" },
    HIDDEN: { label: "Hidden", variant: "warning" },
    DELETED: { label: "Deleted", variant: "danger" },
  };

export function PostsTable({
  initialPosts,
  page,
  totalPages,
  totalCount,
  activeStatus,
  activeAnon,
  activeOrigin,
  realCount,
  seededCount,
  initialShowSeededPosts = true,
}: PostsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, RevealedIdentity>>({});
  const [revealPostId, setRevealPostId] = useState<string | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [showUnlistConfirm, setShowUnlistConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showSeededPosts, setShowSeededPosts] = useState(initialShowSeededPosts);
  const [isTogglingSeededVisibility, setIsTogglingSeededVisibility] = useState(false);

  function pushParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    router.push(`/admin/posts?${params.toString()}`);
  }

  async function runAction(postId: string, fn: () => Promise<unknown>, successMsg = "Done") {
    setActionLoading(postId);
    try {
      await fn();
      toast.success(successMsg);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't do that. Try again.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleHide(postId: string) {
    await runAction(postId, () => toggleHidePost(postId), "Post visibility updated");
  }

  async function handleToggleSeeded(postId: string, currentIsSeeded: boolean) {
    await runAction(
      postId,
      () => togglePostSeededStatus(postId, !currentIsSeeded),
      currentIsSeeded ? "Marked as a student post" : "Marked as a seeded post"
    );
  }

  async function handleUnlistAllSeeded() {
    setActionLoading("bulk_unlist");
    try {
      await unlistAllSeededPosts();
      toast.success("Seeded posts hidden");
      setShowUnlistConfirm(false);
      router.refresh();
    } catch {
      toast.error("Couldn't hide seeded posts. Try again.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRestoreAllSeeded() {
    setActionLoading("bulk_restore");
    try {
      await restoreAllSeededPosts();
      toast.success("Seeded posts are visible again");
      setShowRestoreConfirm(false);
      router.refresh();
    } catch {
      toast.error("Couldn't restore seeded posts. Try again.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleGlobalVisibility(nextVal: boolean) {
    setIsTogglingSeededVisibility(true);
    try {
      setShowSeededPosts(nextVal);
      await toggleGlobalShowSeededPosts(nextVal);
      toast.success(nextVal ? "Seeded posts are showing in feeds" : "Seeded posts are hidden from feeds");
      router.refresh();
    } catch {
      setShowSeededPosts(!nextVal);
      toast.error("Couldn't change this setting. Try again.");
    } finally {
      setIsTogglingSeededVisibility(false);
    }
  }

  async function confirmReveal() {
    if (!revealPostId) return;
    const postId = revealPostId;
    await runAction(
      postId,
      async () => {
        const identity = await revealAnonymousAuthor("POST", postId);
        setRevealed((prev) => ({ ...prev, [postId]: identity }));
        setRevealPostId(null);
      },
      "Author revealed. This is in the audit log."
    );
  }

  async function confirmDelete() {
    if (!deletePostId) return;
    const postId = deletePostId;
    await runAction(
      postId,
      async () => {
        await deletePost(postId);
        setDeletePostId(null);
      },
      "Post deleted"
    );
  }

  return (
    <div className="space-y-4">
      <section
        aria-label="Seeded posts"
        className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="verified">
              <UserCheck className="size-3.5" aria-hidden />
              {realCount.toLocaleString("en-IN")} student posts
            </Badge>
            <Badge variant="neutral">
              <Bot className="size-3.5" aria-hidden />
              {seededCount.toLocaleString("en-IN")} seeded posts
            </Badge>
          </div>
          <p className="text-sm text-fg-muted">Turn seeded posts off so students only see real posts.</p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <label className="flex min-h-11 items-center gap-2.5 rounded-full bg-surface-muted px-3 text-sm font-medium text-fg">
            <Switch
              checked={showSeededPosts}
              disabled={isTogglingSeededVisibility}
              onCheckedChange={(checked) => handleToggleGlobalVisibility(checked)}
            />
            {showSeededPosts ? "Seeded posts on" : "Seeded posts off"}
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUnlistConfirm(true)}
            disabled={actionLoading === "bulk_unlist"}
          >
            <EyeOff aria-hidden />
            Hide all seeded
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRestoreConfirm(true)}
            disabled={actionLoading === "bulk_restore"}
          >
            <RotateCcw aria-hidden />
            Show all seeded
          </Button>
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <AdminFilterRow
          label="Origin"
          options={originTabs}
          value={activeOrigin}
          onChange={(v) =>
            pushParams((p) => {
              p.set("origin", v);
              p.delete("page");
            })
          }
        />
        <AdminFilterRow
          label="Status"
          options={statusTabs}
          value={activeStatus}
          onChange={(v) =>
            pushParams((p) => {
              p.set("status", v);
              p.delete("page");
            })
          }
        />
        <div className="flex flex-col items-stretch justify-between gap-2.5 sm:flex-row sm:items-center">
          <AdminFilterRow
            label="Type"
            options={anonTabs}
            value={activeAnon}
            onChange={(v) =>
              pushParams((p) => {
                p.set("anon", v);
                p.delete("page");
              })
            }
          />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              pushParams((p) => {
                if (search.trim()) p.set("q", search.trim());
                else p.delete("q");
                p.delete("page");
              });
            }}
            className="relative flex-1 sm:max-w-xs"
          >
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts"
              aria-label="Search posts"
              className={cn(fieldClassName, "h-11 w-full pl-9 pr-3")}
            />
          </form>
        </div>
      </div>

      {/* ─── Posts Table ─── */}
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-surface-muted border-b border-border text-xs text-fg-muted">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Post
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Author
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {initialPosts.map((post) => {
                const isReal = !post.isSeeded;
                return (
                  <tr
                    key={post.id}
                    className={cn(
                      "transition-ui hover:bg-surface-muted",
                      post.status === "HIDDEN" && "bg-surface-muted"
                    )}
                  >
                    {/* Post Content */}
                    <td className="px-5 py-3.5 max-w-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="neutral">{post.type.toLowerCase()}</Badge>
                          {post.isAnonymous && (
                            <Badge variant="neutral">
                              <VenetianMask className="size-3" aria-hidden />
                              {post.pseudonym || "Anonymous"}
                            </Badge>
                          )}
                          <span className="text-xs text-fg-subtle">
                            {new Date(post.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <p className="line-clamp-3 break-words text-sm leading-relaxed text-fg">
                          {post.body}
                        </p>

                        {post.institution && (
                          <p className="text-xs text-fg-muted truncate flex items-center gap-1">
                            <School className="size-3 shrink-0 text-fg-muted" />
                            <span>{post.institution.name}</span>
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Author & Origin */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="space-y-1">
                        {isReal ? (
                          <Badge variant="verified">
                            <UserCheck className="size-3" aria-hidden />
                            Student
                          </Badge>
                        ) : (
                          <Badge variant="neutral">
                            <Bot className="size-3" aria-hidden />
                            Seeded
                          </Badge>
                        )}

                        {post.author ? (
                          <div className="text-xs">
                            <p className="max-w-[150px] truncate font-semibold text-fg">
                              {post.author.displayName}
                            </p>
                            <p className="text-xs text-fg-muted truncate max-w-[150px]">
                              @{post.author.username}
                            </p>
                            {post.author.email && (
                              <p className="max-w-[150px] truncate text-xs text-fg-muted">
                                {post.author.email}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-fg-muted italic">Anonymous author</p>
                        )}

                        {revealed[post.id] && (
                          <div className="rounded-sm bg-surface-muted p-1.5 text-xs text-fg">
                            Real author: @{revealed[post.id].username}
                            {revealed[post.id].displayName ? ` (${revealed[post.id].displayName})` : ""}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge variant={statusBadge[post.status]?.variant ?? "neutral"}>
                        {post.status === "HIDDEN" && <EyeOff className="size-3" aria-hidden />}
                        {statusBadge[post.status]?.label ?? post.status.toLowerCase()}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading === post.id}
                          onClick={() => handleToggleHide(post.id)}
                        >
                          {post.status === "PUBLISHED" ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                          {post.status === "PUBLISHED" ? "Hide" : "Unhide"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={actionLoading === post.id}
                          onClick={() => handleToggleSeeded(post.id, post.isSeeded)}
                          aria-label={post.isSeeded ? "Mark as student post" : "Mark as seeded post"}
                          title={post.isSeeded ? "Mark as student post" : "Mark as seeded post"}
                        >
                          {post.isSeeded ? <UserCheck aria-hidden /> : <Bot aria-hidden />}
                        </Button>
                        {post.isAnonymous && !revealed[post.id] && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={actionLoading === post.id}
                            onClick={() => setRevealPostId(post.id)}
                            aria-label="Reveal author (logged)"
                            title="Reveal author (logged)"
                          >
                            <Eye aria-hidden />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={actionLoading === post.id}
                          onClick={() => setDeletePostId(post.id)}
                          aria-label="Delete post"
                          title="Delete post"
                          className="text-danger hover:bg-danger-subtle"
                        >
                          <Trash2 aria-hidden />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {initialPosts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-fg-muted">
                    No posts match. Try another search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <nav
          aria-label="Pages"
          className="flex items-center justify-between border-t border-border bg-surface-muted px-5 py-2"
        >
          <span className="text-xs text-fg-muted">
            {totalCount.toLocaleString("en-IN")} posts · Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              disabled={page <= 1}
              onClick={() => pushParams((p) => p.set("page", String(page - 1)))}
              aria-label="Previous page"
            >
              <ChevronLeft aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => pushParams((p) => p.set("page", String(page + 1)))}
              aria-label="Next page"
            >
              <ChevronRight aria-hidden />
            </Button>
          </div>
        </nav>
      </div>

      {/* ─── Confirm Dialogs ─── */}
      <ConfirmDialog
        isOpen={showUnlistConfirm}
        onClose={() => setShowUnlistConfirm(false)}
        title="Hide all seeded posts?"
        description="Seeded posts stay saved but are hidden from every feed. Only real student posts stay visible."
        confirmText="Hide seeded posts"
        onConfirm={handleUnlistAllSeeded}
      />

      <ConfirmDialog
        isOpen={showRestoreConfirm}
        onClose={() => setShowRestoreConfirm(false)}
        title="Show seeded posts again?"
        description="Seeded posts will show in feeds again."
        confirmText="Show seeded posts"
        onConfirm={handleRestoreAllSeeded}
      />

      <ConfirmDialog
        isOpen={Boolean(revealPostId)}
        onClose={() => setRevealPostId(null)}
        title="Reveal the author?"
        description="Only do this for safety or legal reasons. Your name is saved in the audit log."
        confirmText="Reveal author"
        onConfirm={confirmReveal}
      />

      <ConfirmDialog
        isOpen={Boolean(deletePostId)}
        onClose={() => setDeletePostId(null)}
        title="Delete this post?"
        description="Students won't see it anymore."
        confirmText="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
}

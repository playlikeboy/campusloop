"use client";

import { Bot, Check, Copy, Eye, EyeOff, Pause, Play, RefreshCw, Send, Terminal, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CommunityWebhook } from "@/db/schema";
import { cn, formatTimeAgo } from "@/lib/utils";

interface CommunityWebhookRowProps {
  webhook: CommunityWebhook;
  url: string;
  maskedUrl: string;
  tokenVisible: boolean;
  copied: boolean;
  testing: boolean;
  onToggleToken: () => void;
  onCopy: () => void;
  onToggleActive: () => void;
  onTest: () => void;
  onShowGuide: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
}

export function CommunityWebhookRow({
  webhook: wh,
  url,
  maskedUrl,
  tokenVisible,
  copied,
  testing,
  onToggleToken,
  onCopy,
  onToggleActive,
  onTest,
  onShowGuide,
  onRegenerate,
  onDelete,
}: CommunityWebhookRowProps) {
  return (
    <li
      className={cn(
        "space-y-4 rounded-lg border border-border bg-surface p-4 sm:p-5",
        !wh.isActive && "bg-surface-muted"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-brand-text">
            <Bot className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-fg">{wh.name}</h3>
              <Badge variant="neutral">{wh.botName}</Badge>
            </div>
            <p className="mt-0.5 text-sm text-fg-muted">
              {wh.postsCount} {wh.postsCount === 1 ? "post" : "posts"} ·{" "}
              {wh.lastUsedAt ? `last used ${formatTimeAgo(wh.lastUsedAt)}` : "never used"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={wh.isActive ? "success" : "neutral"}>{wh.isActive ? "On" : "Paused"}</Badge>
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleActive}
            aria-label={wh.isActive ? `Pause ${wh.name}` : `Turn on ${wh.name}`}
          >
            {wh.isActive ? <Pause /> : <Play />}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex h-11 min-w-0 flex-1 items-center gap-1 rounded-md border border-border bg-surface-muted pl-3">
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-fg-muted">
            {tokenVisible ? url : maskedUrl}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleToken}
            aria-label={tokenVisible ? "Hide secret link" : "Show secret link"}
            aria-pressed={tokenVisible}
          >
            {tokenVisible ? <EyeOff /> : <Eye />}
          </Button>
        </div>
        <Button variant="secondary" onClick={onCopy}>
          {copied ? <Check className="text-success" /> : <Copy />}
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <div className="flex flex-wrap items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onTest} loading={testing} disabled={!wh.isActive}>
            {!testing && <Send />}
            Send test post
          </Button>
          <Button variant="ghost" size="sm" onClick={onShowGuide}>
            <Terminal />
            How to use
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRegenerate}
            aria-label={`Make a new secret link for ${wh.name}`}
          >
            <RefreshCw />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label={`Delete ${wh.name}`}
            className="hover:bg-danger-subtle hover:text-danger"
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </li>
  );
}

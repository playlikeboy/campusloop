"use client";

import { Check, Copy, Eye, EyeOff, Key, Plus, Power, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { UserMcpKey } from "@/db/schema";
import { cn, formatTimeAgo } from "@/lib/utils";

interface McpKeyListProps {
  keys: UserMcpKey[];
  selectedKeyId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onToggle: (key: UserMcpKey) => void;
  onRegenerate: (key: UserMcpKey) => void;
  onDelete: (key: UserMcpKey) => void;
  onCopy: (secret: string) => void;
  copiedKey: string | null;
}

/** Personal MCP keys: pick one for the snippets, reveal, copy, pause, rotate or delete. */
export function McpKeyList({
  keys,
  selectedKeyId,
  onSelect,
  onCreate,
  onToggle,
  onRegenerate,
  onDelete,
  onCopy,
  copiedKey,
}: McpKeyListProps) {
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  if (keys.length === 0) {
    return (
      <EmptyState
        icon={Key}
        title="No keys yet"
        description="Make a key to connect Cursor, Windsurf or Claude Desktop."
        action={
          <Button onClick={onCreate}>
            <Plus className="size-4" />
            Make a key
          </Button>
        }
        bordered
      />
    );
  }

  return (
    <ul className="space-y-3" aria-label="Your keys">
      {keys.map((k) => {
        const isSelected = k.id === selectedKeyId;
        const isVisible = Boolean(visible[k.id]);
        const masked = `${k.key.substring(0, 10)}••••••••••••••••`;
        return (
          <li
            key={k.id}
            className={cn(
              "space-y-3 rounded-md border p-4 transition-ui",
              isSelected ? "border-brand bg-brand-subtle" : "border-border bg-surface",
              !k.isActive && "opacity-70"
            )}
          >
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <label className="flex min-w-0 cursor-pointer items-center gap-3">
                <input
                  type="radio"
                  name="mcp-key"
                  checked={isSelected}
                  onChange={() => onSelect(k.id)}
                  className="size-4 shrink-0"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-fg">{k.name}</span>
                    <Badge variant={k.isActive ? "success" : "neutral"}>{k.isActive ? "On" : "Paused"}</Badge>
                  </span>
                  <span className="block text-xs text-fg-muted tabular-nums">
                    {k.requestsCount} calls ·{" "}
                    {k.lastUsedAt ? `last used ${formatTimeAgo(k.lastUsedAt)}` : "never used"}
                  </span>
                </span>
              </label>
              <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onToggle(k)}
                  aria-label={k.isActive ? "Pause key" : "Turn key on"}
                  title={k.isActive ? "Pause key" : "Turn key on"}
                >
                  <Power className={cn("size-4", k.isActive && "text-verified-text")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onRegenerate(k)}
                  aria-label="Make a new token"
                  title="Make a new token"
                >
                  <RefreshCw className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDelete(k)}
                  aria-label="Delete key"
                  title="Delete key"
                  className="hover:bg-danger-subtle hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-10 min-w-0 flex-1 items-center justify-between rounded-md border border-border bg-surface px-3 font-mono text-xs text-fg-muted">
                <span className="truncate">{isVisible ? k.key : masked}</span>
                <button
                  type="button"
                  onClick={() => setVisible((p) => ({ ...p, [k.id]: !p[k.id] }))}
                  className="-mr-2 ml-1 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-ui hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={isVisible ? "Hide token" : "Show token"}
                >
                  {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <Button variant="secondary" size="sm" onClick={() => onCopy(k.key)}>
                {copiedKey === k.key ? (
                  <Check className="size-4 text-verified-text" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copiedKey === k.key ? "Copied" : "Copy"}
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

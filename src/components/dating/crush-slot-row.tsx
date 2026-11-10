"use client";

import { Lock, MessageCircle, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { initials, type SecretCrushItem } from "./crush-types";

export function CrushSlotRow({
  crush,
  removing,
  onRemove,
  onNavigate,
}: {
  crush: SecretCrushItem;
  removing: boolean;
  onRemove: () => void;
  onNavigate?: () => void;
}) {
  const { target } = crush;
  const [confirming, setConfirming] = useState(false);
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <Link
        href={`/@${target.username}`}
        onClick={onNavigate}
        className="flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar className="size-11 shrink-0">
          <AvatarImage src={target.avatarUrl || undefined} alt="" />
          <AvatarFallback className="bg-crush-subtle text-sm font-semibold text-crush-text">
            {initials(target.displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-fg">{target.displayName}</p>
          <p className="truncate text-xs text-fg-muted">
            @{target.username}
            {target.branch ? ` · ${target.branch}` : ""}
          </p>
        </div>
      </Link>

      <div className="flex shrink-0 items-center gap-1">
        {crush.isMutual ? (
          <Button variant="crush" size="sm" asChild>
            <Link href={`/chat?userId=${crush.targetId}`} onClick={onNavigate}>
              <MessageCircle />
              Message
            </Link>
          </Button>
        ) : (
          <Badge variant="neutral" className="gap-1">
            <Lock className="size-3" aria-hidden="true" />
            Hidden
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setConfirming(true)}
          loading={removing}
          aria-label={`Remove ${target.displayName}`}
          className="text-fg-muted"
        >
          {!removing && <Trash2 />}
        </Button>
      </div>
      <ConfirmDialog
        isOpen={confirming}
        title={`Remove ${target.displayName}?`}
        description="You won't get this week's add back."
        confirmText="Remove"
        isLoading={removing}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          onRemove();
        }}
      />
    </li>
  );
}

export function EmptyCrushSlot({ onAdd, disabled }: { onAdd: () => void; disabled: boolean }) {
  return (
    <li>
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className="flex min-h-16 w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm text-fg-muted transition-ui outline-none hover:bg-surface-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-dashed border-border-strong">
          <Plus className="size-4" aria-hidden="true" />
        </span>
        Add someone
      </button>
    </li>
  );
}

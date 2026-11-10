"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { NotificationItem } from "@/hooks/use-notifications";
import { cn, formatTimeAgo, getAvatarUrl } from "@/lib/utils";
import { getNotificationMeta, SYSTEM_TYPES } from "./notification-meta";

const TONE = {
  brand: "bg-brand-subtle text-brand-text",
  crush: "bg-crush-subtle text-crush-text",
  reward: "bg-reward-subtle text-reward-text",
};

export function NotificationRow({
  n,
  onOpen,
}: {
  n: NotificationItem;
  onOpen: (n: NotificationItem) => void;
}) {
  const { Icon, tone, text, href } = getNotificationMeta(n);
  const isSystem = SYSTEM_TYPES.has(n.type);
  const name = n.actor?.displayName || "Someone";

  return (
    <li>
      <Link
        href={href}
        onClick={() => onOpen(n)}
        className={cn(
          "flex items-start gap-3 px-4 py-3 transition-ui outline-none hover:bg-surface-muted focus-visible:bg-surface-muted",
          !n.isRead && "bg-brand-subtle/40"
        )}
      >
        <span className="relative shrink-0">
          {isSystem ? (
            <span className={cn("flex size-11 items-center justify-center rounded-full", TONE[tone])}>
              <Icon aria-hidden="true" className="size-5" />
            </span>
          ) : (
            <>
              <Avatar className="size-11">
                <AvatarImage src={getAvatarUrl(n.actor?.avatarUrl, n.actor?.username || "student")} alt="" />
                <AvatarFallback className="bg-surface-muted text-sm font-semibold">{name[0]}</AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-bg",
                  TONE[tone]
                )}
              >
                <Icon aria-hidden="true" className="size-3" />
              </span>
            </>
          )}
        </span>

        <span className="min-w-0 flex-1 space-y-1">
          <span className="block text-sm leading-snug text-fg">
            {isSystem ? (
              text
            ) : (
              <>
                <span className="font-semibold">{name}</span> {text}
              </>
            )}
          </span>
          {n.previewText && <span className="line-clamp-2 block text-sm text-fg-muted">{n.previewText}</span>}
          <span className="block text-xs text-fg-subtle">{formatTimeAgo(n.createdAt)}</span>
        </span>

        {!n.isRead && (
          <span className="mt-2 size-2.5 shrink-0 rounded-full bg-brand">
            <span className="sr-only">Unread</span>
          </span>
        )}
      </Link>
    </li>
  );
}

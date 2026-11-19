"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoopPointsSticker, MentionTag } from "@/components/ui/stickers";
import type { NotificationItem } from "@/hooks/use-notifications";
import { cn, formatTimeAgo, getAvatarUrl, initialOf } from "@/lib/utils";
import { getNotificationMeta, pointsFromNotification, SYSTEM_TYPES, shortTimeAgo } from "./notification-meta";

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
  const meta = getNotificationMeta(n);
  const { Icon, text, href } = meta;
  const isSystem = SYSTEM_TYPES.has(n.type);
  const name = n.actor?.displayName || "Someone";
  const mention = n.type === "MENTION" && n.actor?.username ? n.actor.username : null;
  const points = pointsFromNotification(n);
  // Yellow means Loop Points: milestones without a points total (e.g. announcements) stay violet.
  const tone = meta.tone === "reward" && points === null ? "brand" : meta.tone;

  return (
    <li>
      <Link
        href={href}
        onClick={() => onOpen(n)}
        className={cn(
          "flex min-h-11 items-start gap-3 px-4 py-2.5 transition-ui outline-none hover:bg-surface-muted focus-visible:bg-surface-muted",
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
                <AvatarFallback className="bg-surface-muted text-sm font-semibold">{initialOf(name)}</AvatarFallback>
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

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm leading-snug text-fg">
            {isSystem ? (
              text
            ) : mention ? (
              <>
                <MentionTag username={mention} size="sm" className="align-middle" /> {text}
              </>
            ) : (
              <>
                <span className="font-semibold">{name}</span> {text}
              </>
            )}
            {n.previewText && <span className="text-fg-muted">: {n.previewText}</span>}
          </p>
          {points !== null && <LoopPointsSticker points={points} size="sm" className="mt-1 w-fit" />}
        </div>

        <span className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
          <time
            dateTime={String(n.createdAt)}
            title={formatTimeAgo(n.createdAt)}
            className="text-xs whitespace-nowrap text-fg-subtle"
            suppressHydrationWarning
          >
            {shortTimeAgo(n.createdAt)}
          </time>
          {!n.isRead && (
            <span className="size-2.5 rounded-full bg-brand">
              <span className="sr-only">Unread</span>
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}

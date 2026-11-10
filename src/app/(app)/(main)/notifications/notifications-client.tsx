"use client";

import { Bell, CheckCheck, Eraser, MoreHorizontal, RotateCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PushNotificationToggle } from "@/components/notifications/push-notification-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { type NotificationItem, type NotificationTab, useNotifications } from "@/hooks/use-notifications";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { NotificationRow } from "./notification-row";

interface NotificationsClientProps {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}

const TABS: { id: NotificationTab; label: string; empty: string }[] = [
  { id: "all", label: "All", empty: "You're all caught up" },
  { id: "messages", label: "Messages", empty: "No new messages" },
  { id: "posts", label: "Following", empty: "No new posts from people you follow" },
  { id: "mentions", label: "Mentions", empty: "No mentions yet" },
  { id: "replies", label: "Replies", empty: "No replies yet" },
  { id: "reactions", label: "Likes", empty: "No likes yet" },
  { id: "crushes", label: "Match", empty: "No matches or crushes yet" },
];

export function NotificationsClient({ initialNotifications, initialUnreadCount }: NotificationsClientProps) {
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingClear, setPendingClear] = useState<"all" | "read" | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [menuOpen]);

  const { notifications, unreadCount, isLoading, error, mutate, markAllAsRead, markAsRead, clearAll } =
    useNotifications(activeTab);
  const list = notifications.length > 0 ? notifications : activeTab === "all" ? initialNotifications : [];
  const unread = unreadCount ?? initialUnreadCount;
  const tab = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  function open(n: NotificationItem) {
    haptics.light();
    if (!n.isRead) markAsRead(n.id);
  }

  async function clear(scope: "all" | "read") {
    setIsClearing(true);
    const ok = await clearAll(scope);
    setIsClearing(false);
    setPendingClear(null);
    setMenuOpen(false);
    if (ok) {
      sounds.archive();
      toast.success(scope === "all" ? "Notifications deleted" : "Read notifications cleared");
    } else {
      toast.error("Couldn't clear notifications. Try again.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl pb-28">
      <header className="sticky top-14 z-20 border-b border-border bg-bg lg:top-0">
        <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl text-fg">Notifications</h1>
            {unread > 0 && <Badge variant="brand">{unread} new</Badge>}
          </div>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  haptics.success();
                  markAllAsRead();
                }}
              >
                <CheckCheck aria-hidden="true" />
                <span className="hidden sm:inline">Mark all read</span>
                <span className="sr-only sm:hidden">Mark all as read</span>
              </Button>
            )}
            {list.length > 0 && (
              <div className="relative" ref={menuRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="More actions"
                >
                  <MoreHorizontal aria-hidden="true" />
                </Button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute top-12 right-0 z-30 w-60 overflow-hidden rounded-md border border-border bg-surface-raised py-1 shadow-lg"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => setPendingClear("read")}
                      className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 px-4 text-left text-sm text-fg hover:bg-surface-muted"
                    >
                      <Eraser aria-hidden="true" className="size-4" />
                      Clear read ones
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => setPendingClear("all")}
                      className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 px-4 text-left text-sm text-danger hover:bg-danger-subtle"
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                      {activeTab === "all" ? "Delete all" : "Delete all in this tab"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <fieldset className="no-scrollbar flex min-w-0 gap-2 overflow-x-auto px-4 pb-3">
          <legend className="sr-only">Filter notifications</legend>
          {TABS.map((t) => (
            <Chip
              key={t.id}
              size="sm"
              selected={activeTab === t.id}
              onSelectedChange={() => setActiveTab(t.id)}
              className="shrink-0"
            >
              {t.label}
            </Chip>
          ))}
        </fieldset>
      </header>

      <PushNotificationToggle variant="banner" />

      {list.length > 0 ? (
        <ul className="divide-y divide-border">
          {list.map((n) => (
            <NotificationRow key={n.id} n={n} onOpen={open} />
          ))}
        </ul>
      ) : isLoading ? (
        <ul aria-busy="true" aria-label="Loading notifications" className="divide-y divide-border">
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="flex items-start gap-3 px-4 py-3">
              <Skeleton className="size-11 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2 pt-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </li>
          ))}
        </ul>
      ) : error ? (
        <EmptyState
          icon={RotateCw}
          title="Couldn't load notifications"
          description="Check your internet and try again."
          action={
            <Button variant="outline" onClick={() => void mutate()}>
              Try again
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={Bell}
          title={tab.empty}
          description="Likes, replies and follows show up here."
          action={
            <Button asChild variant="outline">
              <Link href="/feeds">Go to your feed</Link>
            </Button>
          }
        />
      )}

      <ConfirmDialog
        isOpen={pendingClear !== null}
        variant="danger"
        isLoading={isClearing}
        title={pendingClear === "read" ? "Clear read notifications?" : "Delete all notifications?"}
        description={
          pendingClear === "read"
            ? "Read notifications are removed. Unread ones stay."
            : activeTab === "all"
              ? "Every notification is removed. You can't undo this."
              : "Every notification in this tab is removed. You can't undo this."
        }
        confirmText={pendingClear === "read" ? "Clear" : "Delete all"}
        onConfirm={() => clear(pendingClear ?? "all")}
        onClose={() => {
          if (!isClearing) setPendingClear(null);
        }}
      />
    </div>
  );
}

"use client";

import { ArrowLeft, Ghost } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { DrawerLink, DrawerPanel, DrawerSection } from "@/components/navigation/drawer-panel";
import { ADMIN_NAV_SECTIONS } from "@/constants/navigation";

const ALL_ITEMS = ADMIN_NAV_SECTIONS.flatMap((g) => g.items);

function matches(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Mobile admin navigation. Reuses ADMIN_NAV_SECTIONS so it never drifts from the desktop sidebar. */
export function AdminMobileDrawer({
  open,
  onClose,
  adminName,
  pendingReviewCount = 0,
}: {
  open: boolean;
  onClose: () => void;
  adminName?: string | null;
  pendingReviewCount?: number;
}) {
  const pathname = usePathname() || "/admin";

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Longest matching href wins, so /admin/marketplace/products beats /admin/marketplace.
  const activeHref = [...ALL_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => matches(pathname, i.href))?.href;

  return (
    <DrawerPanel
      open={open}
      onClose={onClose}
      label="Admin menu"
      hideFrom="md:hidden"
      header={
        <div className="min-w-0">
          <p className="font-display text-lg font-bold leading-tight text-fg">Admin</p>
          {adminName && <p className="truncate text-sm text-fg-muted">{adminName}</p>}
        </div>
      }
      footer={
        <div className="space-y-1">
          <DrawerLink href="/feeds" label="Back to CampusLoop" icon={ArrowLeft} onNavigate={onClose} />
          <p className="flex items-center gap-1.5 px-3 pb-1 text-xs text-fg-muted">
            <Ghost className="size-3" aria-hidden />
            Identity reveals are logged
          </p>
        </div>
      }
    >
      {ADMIN_NAV_SECTIONS.map((section) => (
        <DrawerSection key={section.title} title={section.title}>
          {section.items.map((item) => (
            <DrawerLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={activeHref === item.href}
              onNavigate={onClose}
              badge={
                item.href === "/admin/review" && pendingReviewCount > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-xs font-bold text-danger-fg">
                    {pendingReviewCount > 99 ? "99+" : pendingReviewCount}
                  </span>
                ) : undefined
              }
            />
          ))}
        </DrawerSection>
      ))}
    </DrawerPanel>
  );
}

"use client";

import { ArrowLeft, Ghost } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { DrawerLink, DrawerPanel, DrawerSection } from "@/components/navigation/drawer-panel";
import { ADMIN_NAV_SECTIONS } from "./admin-sidebar";

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
  const activeHref = [...ALL_ITEMS].sort((a, b) => b.href.length - a.href.length).find((i) => matches(pathname, i.href))?.href;

  return (
    <DrawerPanel
      open={open}
      onClose={onClose}
      label="Admin menu"
      hideFrom="md:hidden"
      header={
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-destructive" aria-hidden />
            Admin Console
          </p>
          <p className="truncate text-lg font-bold leading-tight text-foreground">{adminName || "CampusLoop"}</p>
        </div>
      }
      footer={
        <div className="space-y-1">
          <DrawerLink href="/feeds" label="Back to CampusLoop" icon={ArrowLeft} onNavigate={onClose} />
          <p className="flex items-center gap-1.5 px-3 pb-1 text-[11px] text-muted-foreground">
            <Ghost className="size-3" aria-hidden />
            Identity reveals are audit-logged
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
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-white">
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

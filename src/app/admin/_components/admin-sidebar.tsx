"use client";

import {
  Activity,
  ArrowLeft,
  Bike,
  BookOpen,
  ChevronRight,
  FileText,
  FlaskConical,
  Ghost,
  LayoutDashboard,
  Link2,
  Megaphone,
  MessageSquare,
  Play,
  RotateCw,
  School,
  ScrollText,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
  UtensilsCrossed,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const ADMIN_NAV_SECTIONS = [
  {
    title: "Operations & Safety",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/review", label: "Review Queue", icon: ShieldAlert },
      { href: "/admin/reports", label: "Reports", icon: ShieldAlert },
      { href: "/admin/confessions", label: "Confessions", icon: Ghost },
      { href: "/admin/academics", label: "Academics Vault", icon: BookOpen },
    ],
  },
  {
    title: "Content & Campus",
    items: [
      { href: "/admin/posts", label: "Posts", icon: FileText },
      { href: "/admin/comments", label: "Comments", icon: MessageSquare },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/colleges", label: "Campus Hubs", icon: School },
      { href: "/admin/feed", label: "Feed Curation", icon: TrendingUp },
      { href: "/admin/broadcasts", label: "Broadcasts", icon: Megaphone },
    ],
  },
  {
    title: "Ingestion & Automation",
    items: [
      { href: "/admin/composio", label: "Reddit Ingestion", icon: Zap },
      { href: "/admin/jobs", label: "Background Jobs", icon: RotateCw },
      { href: "/admin/links", label: "Short Links & Refs", icon: Link2 },
      { href: "/admin/embeds", label: "Embeds Inspector", icon: Play },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { href: "/admin/marketplace", label: "Overview", icon: ShoppingBag },
      { href: "/admin/marketplace/merchants", label: "Merchants", icon: Store },
      { href: "/admin/marketplace/products", label: "Products", icon: UtensilsCrossed },
      { href: "/admin/marketplace/rentals", label: "Bike Rentals", icon: Bike },
    ],
  },
  {
    title: "Telemetry & Security",
    items: [
      { href: "/admin/system", label: "System Health Matrix", icon: Server },
      { href: "/admin/analytics", label: "Analytics & Pulse", icon: Activity },
      { href: "/admin/experiments", label: "Ranking Experiments", icon: FlaskConical },
      { href: "/admin/audit", label: "Audit Log Trail", icon: ScrollText },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface AdminSidebarProps {
  isCollapsed?: boolean;
  onCloseMobileDrawer?: () => void;
  isMobileDrawer?: boolean;
}

export function AdminSidebar({
  isCollapsed = false,
  onCloseMobileDrawer,
  isMobileDrawer = false,
}: AdminSidebarProps) {
  const pathname = usePathname();

  function isItemActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={cn(
        "h-full flex flex-col justify-between overflow-y-auto no-scrollbar transition-all duration-200 select-none",
        isMobileDrawer
          ? "w-full p-4 bg-card"
          : isCollapsed
            ? "w-16 px-2 py-4 border-r border-border/60 bg-card/90"
            : "w-60 px-3.5 py-4 border-r border-border/60 bg-card/90"
      )}
    >
      <div className="space-y-5">
        {/* Top Header in Sidebar */}
        <div
          className={cn(
            "flex items-center",
            isCollapsed && !isMobileDrawer ? "justify-center" : "justify-between px-2"
          )}
        >
          <Link
            href="/admin"
            className="flex items-center gap-2.5 font-bold tracking-tight text-foreground"
          >
            <div className="size-7 rounded-lg bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shrink-0">
              <Shield className="size-4" />
            </div>
            {(!isCollapsed || isMobileDrawer) && (
              <div className="flex flex-col leading-none">
                <span className="text-sm font-extrabold tracking-tight">CampusLoop</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  Ops Console
                </span>
              </div>
            )}
          </Link>

          {isMobileDrawer && onCloseMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              className="size-8 rounded-lg bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="space-y-4">
          {ADMIN_NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-0.5">
              {(!isCollapsed || isMobileDrawer) && (
                <p className="px-2.5 pb-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobileDrawer}
                    title={isCollapsed && !isMobileDrawer ? item.label : undefined}
                    className={cn(
                      "flex items-center rounded-lg text-xs font-semibold transition-all group",
                      isCollapsed && !isMobileDrawer
                        ? "justify-center size-9 mx-auto"
                        : "gap-2.5 px-2.5 py-1.8",
                      active
                        ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {(!isCollapsed || isMobileDrawer) && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                    {(!isCollapsed || isMobileDrawer) && active && (
                      <ChevronRight className="size-3.5 opacity-60 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div className="pt-3 border-t border-border/50 space-y-2 mt-4">
        <Link
          href="/feeds"
          onClick={onCloseMobileDrawer}
          title={isCollapsed && !isMobileDrawer ? "Exit to Student Feed" : undefined}
          className={cn(
            "flex items-center rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors",
            isCollapsed && !isMobileDrawer ? "justify-center size-9 mx-auto" : "gap-2 px-2.5 py-2"
          )}
        >
          <ArrowLeft className="size-3.5 shrink-0" />
          {(!isCollapsed || isMobileDrawer) && <span>Exit to Campus App</span>}
        </Link>
        {(!isCollapsed || isMobileDrawer) && (
          <p className="px-2 text-[10px] text-muted-foreground/60 flex items-center gap-1.5 leading-tight">
            <Ghost className="size-3 shrink-0" />
            <span>Identity reveals are strictly audit-logged</span>
          </p>
        )}
      </div>
    </aside>
  );
}

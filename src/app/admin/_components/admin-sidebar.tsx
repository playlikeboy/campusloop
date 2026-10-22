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
  Inbox,
  KeyRound,
  Link2,
  Mail,
  Megaphone,
  MessageSquare,
  School,
  ScrollText,
  Server,
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

export interface AdminNavItem {
  href: string;
  label: string;
  icon: typeof Inbox;
  desc: string;
  keywords?: string[];
}

/** Admin navigation: one source for the sidebar, mobile drawer and Cmd+K search. Real tools only. */
export const ADMIN_NAV_SECTIONS: { title: string; items: AdminNavItem[] }[] = [
  {
    title: "Requests",
    items: [
      { href: "/admin", label: "Inbox", icon: Inbox, desc: "Everything waiting for a decision", keywords: ["dashboard", "pending", "requests", "todo"] },
      { href: "/admin/review", label: "Review queue", icon: ShieldAlert, desc: "Posts held by the safety filter", keywords: ["moderation", "flagged"] },
      { href: "/admin/reports", label: "Reports", icon: ShieldAlert, desc: "Content reported by students", keywords: ["abuse", "flags"] },
      { href: "/admin/confessions", label: "Confessions", icon: Ghost, desc: "Anonymous posts and identity reveals", keywords: ["anonymous"] },
      { href: "/admin/oauth-apps", label: "Developer apps", icon: KeyRound, desc: "Login with CampusLoop apps", keywords: ["oauth", "oidc", "login with campusloop", "clients"] },
    ],
  },
  {
    title: "People & campuses",
    items: [
      { href: "/admin/users", label: "Users", icon: Users, desc: "Search, verify, suspend or ban accounts", keywords: ["students", "ban"] },
      { href: "/admin/colleges", label: "Colleges", icon: School, desc: "Campus hubs and email domains", keywords: ["institutions", "hubs"] },
      { href: "/admin/outreach", label: "Outreach", icon: Mail, desc: "College contacts and campaigns", keywords: ["email", "campaign"] },
      { href: "/admin/broadcasts", label: "Broadcasts", icon: Megaphone, desc: "Banners shown on campus feeds", keywords: ["announcement"] },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/posts", label: "Posts", icon: FileText, desc: "All posts across campuses" },
      { href: "/admin/comments", label: "Comments", icon: MessageSquare, desc: "All comments" },
      { href: "/admin/academics", label: "Study material", icon: BookOpen, desc: "Notes and PYQs in the Academic Vault", keywords: ["notes", "pyq", "vault"] },
      { href: "/admin/feed", label: "Feed boosts", icon: TrendingUp, desc: "Pin and boost posts in feeds", keywords: ["curation", "pin"] },
      { href: "/admin/composio", label: "Reddit import", icon: Zap, desc: "Import campus subreddit discussions", keywords: ["reddit", "ingestion", "composio"] },
      { href: "/admin/links", label: "Short links", icon: Link2, desc: "campusloop.space/s/ links and referral clicks", keywords: ["referral", "utm"] },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { href: "/admin/marketplace", label: "Overview", icon: ShoppingBag, desc: "Orders and revenue" },
      { href: "/admin/marketplace/merchants", label: "Merchants", icon: Store, desc: "Campus shops" },
      { href: "/admin/marketplace/products", label: "Products", icon: UtensilsCrossed, desc: "Menus and listings" },
      { href: "/admin/marketplace/rentals", label: "Bike rentals", icon: Bike, desc: "Rental fleet" },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/admin/analytics", label: "Analytics", icon: Activity, desc: "Growth and engagement", keywords: ["metrics", "dau"] },
      { href: "/admin/experiments", label: "Experiments", icon: FlaskConical, desc: "Feed ranking A/B results", keywords: ["ab test", "ranking"] },
      { href: "/admin/system", label: "System health", icon: Server, desc: "Database, cache and edge checks", keywords: ["status", "diagnostics"] },
      { href: "/admin/audit", label: "Audit log", icon: ScrollText, desc: "Every admin action", keywords: ["history"] },
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
                        : "gap-2.5 px-2.5 py-2",
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

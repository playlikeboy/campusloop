"use client";

import {
  Activity,
  ArrowLeft,
  Bike,
  BookOpen,
  ChevronRight,
  FileText,
  Ghost,
  LayoutDashboard,
  Link2,
  Megaphone,
  Menu,
  MessageSquare,
  Play,
  School,
  ScrollText,
  Server,
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
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    title: "Operations & Safety",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/review", label: "Review Queue", icon: ShieldAlert },
      { href: "/admin/reports", label: "Reports", icon: ShieldAlert },
      { href: "/admin/academics", label: "Academics Vault", icon: BookOpen },
    ],
  },
  {
    title: "Content & Campus",
    items: [
      { href: "/admin/feed", label: "Feed Curation", icon: TrendingUp },
      { href: "/admin/posts", label: "Posts", icon: FileText },
      { href: "/admin/comments", label: "Comments", icon: MessageSquare },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/colleges", label: "Colleges", icon: School },
      { href: "/admin/broadcasts", label: "Campus Broadcasts", icon: Megaphone },
    ],
  },
  {
    title: "Integrations & Studio",
    items: [
      { href: "/admin/composio", label: "Composio Hub", icon: Zap },
      { href: "/admin/embeds", label: "Embeds Inspector", icon: Play },
      { href: "/admin/links", label: "Short Links & Refs", icon: Link2 },
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
    title: "Telemetry & System",
    items: [
      { href: "/admin/analytics", label: "Analytics & Pulse", icon: Activity },
      { href: "/admin/system", label: "System Health Matrix", icon: Server },
      { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
    ],
  },
];

// Quick shortcut pills for mobile
const QUICK_TABS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/review", label: "Review", icon: ShieldAlert },
  { href: "/admin/posts", label: "Posts", icon: FileText },
  { href: "/admin/reports", label: "Reports", icon: ShieldAlert },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/academics", label: "Academics", icon: BookOpen },
  { href: "/admin/marketplace", label: "Market", icon: ShoppingBag },
  { href: "/admin/analytics", label: "Analytics", icon: Activity },
];

export function AdminMobileHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Find active item label
  const allItems = NAV_GROUPS.flatMap((g) => g.items);
  const activeItem =
    allItems.find((i) => i.href === pathname) ||
    allItems.find((i) => i.href !== "/admin" && pathname.startsWith(i.href));

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl md:hidden">
        {/* Top Navbar Row */}
        <div className="flex items-center justify-between px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex size-9 items-center justify-center rounded-xl bg-muted/50 border border-border/40 text-foreground hover:bg-muted transition-colors active:scale-95"
              aria-label={isOpen ? "Close admin menu" : "Open admin menu"}
            >
              {isOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>

            <Link href="/admin" className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-bold tracking-tight text-foreground">
                Admin Console
              </span>
            </Link>

            {activeItem && activeItem.href !== "/admin" && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/30 truncate max-w-[110px]">
                {activeItem.label}
              </span>
            )}
          </div>

          <Link
            href="/app"
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-xl bg-muted/50 border border-border/40 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Exit</span>
          </Link>
        </div>

        {/* Quick Horizontal Scroll Pills */}
        <nav
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-3 py-1.5 border-t border-border/30 bg-muted/10 text-xs"
          aria-label="Admin Quick Tabs"
        >
          {QUICK_TABS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 shadow-2xs",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Icon className="size-3" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Slide-over Mobile Drawer / Navigation Menu */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex md:hidden bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative flex flex-col w-[85%] max-w-xs h-full bg-card border-r border-border shadow-2xl p-4 overflow-y-auto animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-destructive animate-pulse" />
                <h2 className="text-sm font-black tracking-tight text-foreground">
                  CampusLoop Admin
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="size-8 flex items-center justify-center rounded-xl bg-muted/40 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Navigation Groups */}
            <div className="flex-1 py-4 space-y-5">
              {NAV_GROUPS.map((group) => (
                <div key={group.title} className="space-y-1">
                  <p className="px-2.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
                    {group.title}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        item.href === "/admin"
                          ? pathname === "/admin"
                          : pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "text-foreground hover:bg-muted/60"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={cn(
                                "size-4",
                                isActive ? "text-primary-foreground" : "text-muted-foreground"
                              )}
                            />
                            <span>{item.label}</span>
                          </div>
                          {isActive && <ChevronRight className="size-3.5 opacity-80" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Footer Info */}
            <div className="pt-3 border-t border-border/40 space-y-2">
              <Link
                href="/app"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                <span>Exit to CampusLoop App</span>
              </Link>
              <p className="px-2 text-[10px] text-muted-foreground/70 flex items-center gap-1.5">
                <Ghost className="size-3" /> Identity reveals are logged
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

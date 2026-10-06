"use client";

import {
  Activity,
  ArrowRight,
  Bike,
  BookOpen,
  Command,
  FileText,
  Ghost,
  LayoutDashboard,
  Link2,
  Megaphone,
  MessageSquare,
  Play,
  RotateCw,
  School,
  ScrollText,
  Search,
  Server,
  Settings,
  ShieldAlert,
  ShoppingBag,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface SearchItem {
  id: string;
  title: string;
  description: string;
  category: "Operations" | "Content" | "Integrations" | "System";
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
}

const SEARCH_ITEMS: SearchItem[] = [
  {
    id: "dashboard",
    title: "Dashboard Overview",
    description: "Real-time network telemetry, active users, and KPI summaries",
    category: "Operations",
    href: "/admin",
    icon: LayoutDashboard,
    keywords: ["home", "kpi", "overview", "stats"],
  },
  {
    id: "review",
    title: "Review Queue",
    description: "Quarantined and auto-flagged posts awaiting human moderation",
    category: "Operations",
    href: "/admin/review",
    icon: ShieldAlert,
    keywords: ["flagged", "pending", "queue", "safety", "toxic"],
  },
  {
    id: "reports",
    title: "Content Reports",
    description: "Student-reported posts, abuse reasons, and triage actions",
    category: "Operations",
    href: "/admin/reports",
    icon: ShieldAlert,
    keywords: ["violations", "complaints", "flags", "triage"],
  },
  {
    id: "confessions",
    title: "Sealed Confessions",
    description: "Anonymous confession moderation with zero identity disclosure",
    category: "Operations",
    href: "/admin/confessions",
    icon: Ghost,
    keywords: ["anon", "anonymous", "whispers", "secrets"],
  },
  {
    id: "posts",
    title: "Posts Management",
    description: "Search, filter, unlist, or hide authentic and seeded campus posts",
    category: "Content",
    href: "/admin/posts",
    icon: FileText,
    keywords: ["timeline", "content", "unlisted", "seeded", "publish"],
  },
  {
    id: "comments",
    title: "Comments Moderation",
    description: "Threaded discussion moderation and comment removals",
    category: "Content",
    href: "/admin/comments",
    icon: MessageSquare,
    keywords: ["replies", "discussions", "chat"],
  },
  {
    id: "users",
    title: "User Directory & Analytics",
    description: "Student profiles, campus affiliations, roles, suspensions",
    category: "Content",
    href: "/admin/users",
    icon: Users,
    keywords: ["students", "profiles", "bans", "suspensions", "moderators"],
  },
  {
    id: "colleges",
    title: "Campus Hubs & Colleges",
    description: "1,350+ indexed Indian college hubs, email domains, NIRF ranks",
    category: "Content",
    href: "/admin/colleges",
    icon: School,
    keywords: ["institutions", "universities", "domains", "nirf", "campus"],
  },
  {
    id: "academics",
    title: "Academics Vault",
    description: "Resource moderation, PYQ notes, syllabus verification",
    category: "Content",
    href: "/admin/academics",
    icon: BookOpen,
    keywords: ["notes", "pyqs", "study", "vault"],
  },
  {
    id: "feed-curation",
    title: "Feed Curation & Boosts",
    description: "Editorial pinned posts and algorithm multiplier controls",
    category: "Content",
    href: "/admin/feed",
    icon: TrendingUp,
    keywords: ["boosts", "algorithm", "curation", "ranking"],
  },
  {
    id: "broadcasts",
    title: "Campus Broadcasts",
    description: "Platform-wide emergency broadcasts and announcements",
    category: "Content",
    href: "/admin/broadcasts",
    icon: Megaphone,
    keywords: ["announcements", "notifications", "alerts", "emergency"],
  },
  {
    id: "reddit",
    title: "Reddit Ingestion Studio",
    description: "Fetch discussions from university subreddits into campus feeds",
    category: "Integrations",
    href: "/admin/composio",
    icon: Zap,
    keywords: ["reddit", "btechtards", "fetch", "import", "composio"],
  },
  {
    id: "jobs",
    title: "Background Jobs & Pipelines",
    description: "Async ingestion runs, cache purges, webhooks, and telemetry exports",
    category: "Integrations",
    href: "/admin/jobs",
    icon: RotateCw,
    keywords: ["async", "queue", "tasks", "pipeline", "cron"],
  },
  {
    id: "marketplace",
    title: "Marketplace & Merchants",
    description: "Night canteens, campus shops, student rentals, and orders",
    category: "Integrations",
    href: "/admin/marketplace",
    icon: ShoppingBag,
    keywords: ["shops", "stores", "food", "rentals", "orders"],
  },
  {
    id: "links",
    title: "Short Links & Embeds",
    description: "URL shorteners, ref trackers, and rich media inspectors",
    category: "Integrations",
    href: "/admin/links",
    icon: Link2,
    keywords: ["urls", "shortener", "refs", "embeds"],
  },
  {
    id: "system",
    title: "System Health Matrix",
    description: "Database, Redis, Qdrant, auth, CDN latency checks and diagnostic status",
    category: "System",
    href: "/admin/system",
    icon: Server,
    keywords: ["health", "latency", "neon", "redis", "qdrant", "cloudflare"],
  },
  {
    id: "analytics",
    title: "Analytics & Platform Pulse",
    description: "Engagement velocity, daily active students, and retention",
    category: "System",
    href: "/admin/analytics",
    icon: Activity,
    keywords: ["metrics", "growth", "active", "charts"],
  },
  {
    id: "audit",
    title: "Audit Log Trail",
    description: "Immutable log of every admin mutation and identity reveal",
    category: "System",
    href: "/admin/audit",
    icon: ScrollText,
    keywords: ["security", "log", "moderator", "reveals", "compliance"],
  },
  {
    id: "settings",
    title: "Admin Settings",
    description: "Platform safety rules, keyword blocklists, and notification webhooks",
    category: "System",
    href: "/admin/settings",
    icon: Settings,
    keywords: ["config", "rules", "filters", "webhooks", "keys"],
  },
];

interface AdminGlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminGlobalSearch({ isOpen, onClose }: AdminGlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!query.trim()) return SEARCH_ITEMS;
    const q = query.toLowerCase().trim();
    return SEARCH_ITEMS.filter((item) => {
      const inTitle = item.title.toLowerCase().includes(q);
      const inDesc = item.description.toLowerCase().includes(q);
      const inKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q));
      return inTitle || inDesc || inKeywords;
    });
  }, [query]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < filteredItems.length ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
        e.preventDefault();
        const target = filteredItems[selectedIndex];
        router.push(target.href);
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, router, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-20 bg-background/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/60 bg-muted/20">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search admin operations, routes, tools, or shortcuts..."
            className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/70 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="size-3.5" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground bg-muted/60 border border-border/40 rounded">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No admin operational areas match &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/50 text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "size-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                        isSelected
                          ? "bg-primary-foreground/15 border-primary-foreground/20 text-primary-foreground"
                          : "bg-muted/40 border-border/40 text-muted-foreground"
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate">{item.title}</span>
                        <span
                          className={cn(
                            "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border shrink-0",
                            isSelected
                              ? "bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground"
                              : "bg-muted/60 border-border/40 text-muted-foreground"
                          )}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-[11px] truncate",
                          isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    className={cn(
                      "size-3.5 shrink-0 transition-transform",
                      isSelected ? "translate-x-0.5 text-primary-foreground" : "opacity-0"
                    )}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-4 py-2 border-t border-border/60 bg-muted/15 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono">
              <span className="px-1 py-0.5 bg-muted rounded border border-border/40 text-[10px]">↑</span>
              <span className="px-1 py-0.5 bg-muted rounded border border-border/40 text-[10px]">↓</span>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1 font-mono">
              <span className="px-1 py-0.5 bg-muted rounded border border-border/40 text-[10px]">↵</span>
              <span>to select</span>
            </span>
          </div>
          <span>{filteredItems.length} destinations</span>
        </div>
      </div>
    </div>
  );
}

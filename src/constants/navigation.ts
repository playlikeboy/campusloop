import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  Bike,
  BookOpen,
  Bookmark,
  Building2,
  Cake,
  Calendar,
  Car,
  Compass,
  FileText,
  Flame,
  FlaskConical,
  Gamepad2,
  Ghost,
  GraduationCap,
  Heart,
  HelpCircle,
  Home,
  Hourglass,
  Inbox,
  KeyRound,
  Link2,
  Lock,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  PlayCircle,
  Plus,
  School,
  ScrollText,
  Search,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Terminal,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Zap,
} from "lucide-react";

/** Semantic badge tones, rendered through the Badge primitive's variants. */
export type NavBadgeTone = "brand" | "reward" | "crush" | "success" | "warning" | "neutral";

export interface NavItem {
  icon: LucideIcon;
  href: string;
  label: string;
  desc?: string;
  badge?: string;
  badgeTone?: NavBadgeTone;
  /** Opens in a new tab; href is an absolute URL. */
  external?: boolean;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

/** Desktop sidebar, in order. Everything else lives behind More. */
export const DESKTOP_NAV_ITEMS: NavItem[] = [
  { icon: Home, href: "/feeds", label: "Home" },
  { icon: GraduationCap, href: "/academics", label: "Academics" },
  { icon: PlayCircle, href: "/courses", label: "Courses" },
  { icon: Users, href: "/communities", label: "Communities" },
  { icon: Calendar, href: "/events", label: "Events" },
  { icon: School, href: "/colleges", label: "Colleges" },
  { icon: Heart, href: "/matching", label: "Match" },
  { icon: MessageCircle, href: "/chat", label: "Messages" },
  { icon: Bell, href: "/notifications", label: "Notifications" },
  { icon: MoreHorizontal, href: "/more", label: "More" },
];

/** Mobile bottom tab bar. Exactly five; Post is the prominent centre action. */
export const MOBILE_BOTTOM_ITEMS: NavItem[] = [
  { icon: Home, href: "/feeds", label: "Home" },
  { icon: School, href: "/colleges", label: "Colleges" },
  { icon: Plus, href: "/post/new", label: "Post" },
  { icon: MessageCircle, href: "/chat", label: "Chat" },
  { icon: Heart, href: "/matching", label: "Match" },
];

export const BETA_HUB_ITEMS: NavItem[] = [
  {
    icon: ShoppingBag,
    href: "/marketplace",
    label: "Campus Marketplace",
    desc: "Buy and sell dorm essentials, books and cycles, or order from campus canteens",
    badge: "Beta",
    badgeTone: "warning",
  },
  {
    icon: Zap,
    href: "/random",
    label: "Random Loop",
    desc: "Instant real-time chat with a verified peer you have not met yet",
    badge: "Beta",
    badgeTone: "warning",
  },
  {
    icon: Hourglass,
    href: "/capsule",
    label: "Time Capsule",
    desc: "Batch memory vault locked until convocation and landmark dates",
    badge: "Vault",
    badgeTone: "brand",
  },
  {
    icon: Gamepad2,
    href: "/gaming",
    label: "Gaming and Esports",
    desc: "Campus BGMI, Valorant and FIFA tournaments and hostel gaming lobbies",
    badge: "Esports",
    badgeTone: "neutral",
  },
  {
    icon: Sparkles,
    href: "/ai",
    label: "Campus AI Assistant",
    desc: "Ask about campus fests, study roadmaps, hostel tips and how to use CampusLoop",
    badge: "AI",
    badgeTone: "brand",
  },
  {
    icon: Compass,
    href: "/atlas",
    label: "CampusLoop Atlas",
    desc: "Agent that reasons over real campus clubs, schedules and multi-constraint queries",
    badge: "Agent",
    badgeTone: "brand",
  },
  {
    icon: Terminal,
    href: "/developer",
    label: "Developer and MCP Hub",
    desc: "Connect Cursor, Windsurf, Claude Desktop and AI agents with personal MCP server keys",
    badge: "MCP",
    badgeTone: "neutral",
  },
];

export const MORE_HUB_SECTIONS: NavGroup[] = [
  {
    group: "Core campus hubs",
    items: [
      {
        icon: GraduationCap,
        href: "/academics",
        label: "Academic Vault",
        desc: "Notes, PPTs, books, PYQs, syllabus and branch study resources",
        badge: "+20 LP",
        badgeTone: "reward",
      },
      {
        icon: Flame,
        href: "/confessions",
        label: "Campus Confessions",
        desc: "Anonymous campus confessions with sealed identity escrow",
        badge: "Anon",
        badgeTone: "neutral",
      },
      {
        icon: Users,
        href: "/communities",
        label: "Communities and Clubs",
        desc: "Student-created clubs, technical societies and campus interest groups",
      },
      {
        icon: School,
        href: "/colleges",
        label: "Colleges Directory",
        desc: "Indexed Indian college hubs, rankings and hub request forms",
        badge: "Directory",
        badgeTone: "neutral",
      },
      {
        icon: Building2,
        href: "/campus",
        label: "Campus Hub",
        desc: "Your college's feed, notices and people",
      },
    ],
  },
  {
    group: "Campus living and utilities",
    items: [
      {
        icon: Calendar,
        href: "/events",
        label: "Events, Fests and Hackathons",
        desc: "College fests, hackathons, workshops, recruitments and registrations",
      },
      {
        icon: BookOpen,
        href: "/articles",
        label: "Articles and Roadmaps",
        desc: "Placement roadmaps, tech tutorials, interviews and campus long reads",
      },
      {
        icon: PlayCircle,
        href: "/courses",
        label: "Courses",
        desc: "Free university and creator courses, imported playlist by playlist",
      },
      {
        icon: Building2,
        href: "/housing",
        label: "Housing and Flatmates",
        desc: "Verified student flatmates, hostel rooms, PGs and apartments near campus",
      },
      {
        icon: Search,
        href: "/lost-and-found",
        label: "Lost and Found",
        desc: "Report and recover misplaced ID cards, keys, earbuds and gadgets",
      },
      {
        icon: Car,
        href: "/rideshare",
        label: "Ride Share and Carpools",
        desc: "Split cabs to the airport, railway station, weekend trips and daily commutes",
      },
      {
        icon: Cake,
        href: "/birthdays",
        label: "Campus Birthdays",
        desc: "Celebrate classmates and batchmates born today",
      },
    ],
  },
  {
    group: "Social, discovery and fun",
    items: [
      {
        icon: Heart,
        href: "/matching",
        label: "Campus Match",
        desc: "Friends, study partners and shared interests, college-verified only",
        badge: "Match",
        badgeTone: "crush",
      },
      {
        icon: Lock,
        href: "/crush",
        label: "Secret Crush Vault",
        desc: "Five hidden slots; both sides learn only on a mutual match",
        badge: "Secret",
        badgeTone: "crush",
      },
      {
        icon: Compass,
        href: "/explore",
        label: "Explore",
        desc: "Trending posts, hashtags and people across campuses",
      },
      {
        icon: Sparkles,
        href: "/ecosystem",
        label: "Ecosystem",
        desc: "Everything built by and for the CampusLoop community",
      },
    ],
  },
  {
    group: "Account and trust",
    items: [
      {
        icon: Bookmark,
        href: "/saved",
        label: "Saved posts",
        desc: "Your private vault of bookmarked posts, threads and resources",
      },
      {
        icon: Settings,
        href: "/settings",
        label: "Settings and privacy",
        desc: "Account privacy, notification preferences and verification",
      },
      {
        icon: ShieldCheck,
        href: "/safety",
        label: "Safety and community guidelines",
        desc: "Verified student network rules, identity escrow and moderation standards",
      },
      {
        icon: HelpCircle,
        href: "/contact",
        label: "Help and feedback",
        desc: "Reach the CampusLoop team or apply to become a campus ambassador",
      },
    ],
  },
  {
    group: "CampusLoop ecosystem",
    items: [
      {
        icon: Terminal,
        href: "https://dsaloop.campusloop.space",
        label: "DSALoop",
        desc: "Coding interview patterns, company tracks and a system design primer",
        badge: "Product",
        badgeTone: "success",
        external: true,
      },
      {
        icon: Heart,
        href: "https://baby.campusloop.space",
        label: "baby (AI journal)",
        desc: "A calm journal and reflection companion. Private by default, no streaks",
        badge: "Product",
        badgeTone: "success",
        external: true,
      },
    ],
  },
];

/** Grouped links for the mobile drawer. Primary items first, then every hub not already in them. */
export const DRAWER_SECTIONS: NavGroup[] = [
  { group: "Main", items: DESKTOP_NAV_ITEMS.filter((i) => i.href !== "/more") },
  ...MORE_HUB_SECTIONS.map((section) => ({
    group: section.group,
    items: section.items.filter((item) => !DESKTOP_NAV_ITEMS.some((d) => d.href === item.href)),
  })).filter((section) => section.items.length > 0),
];

/* ───────────────────────── Admin console ───────────────────────── */

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
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
    title: "People and campuses",
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

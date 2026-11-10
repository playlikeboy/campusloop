import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  Bike,
  Bookmark,
  BookOpen,
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
  LayoutGrid,
  Link2,
  Lock,
  Mail,
  Map as MapIcon,
  Megaphone,
  MessageCircle,
  MessageSquare,
  PackageSearch,
  PlayCircle,
  Plus,
  School,
  ScrollText,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  Terminal,
  TrendingUp,
  User,
  Users,
  UtensilsCrossed,
  Zap,
} from "lucide-react";

/**
 * Single source of truth for app navigation.
 * Every nav surface (sidebar, bottom bar, drawer, More page) reads from NAV_GROUPS.
 * One canonical route per feature; old duplicates redirect to these.
 */

/** Semantic badge tones, rendered through the Badge primitive's variants. */
export type NavBadgeTone = "brand" | "reward" | "crush" | "success" | "warning" | "neutral";

export interface NavItem {
  icon: LucideIcon;
  href: string;
  label: string;
  /** One short line, used on the More page only. */
  desc?: string;
  badge?: string;
  badgeTone?: NavBadgeTone;
  /** Opens in a new tab; href is an absolute URL. */
  external?: boolean;
  /** Still being tested. Listed under "Try new things" on the More page. */
  beta?: boolean;
}

export type NavGroupId = "home" | "campus" | "connect" | "utilities" | "learn" | "you";

export interface NavGroup {
  id?: NavGroupId | "other";
  group: string;
  items: NavItem[];
}

/** Canonical routes. Use these constants instead of string literals in nav code. */
export const ROUTES = {
  home: "/feeds",
  explore: "/explore",
  notifications: "/notifications",
  newPost: "/post/new",
  chat: "/chat",
  profile: "/profile",
  communities: "/communities",
  events: "/events",
  confessions: "/confessions",
  colleges: "/colleges",
  birthdays: "/birthdays",
  match: "/matching",
  crush: "/crush",
  random: "/random",
  gaming: "/gaming",
  living: "/living",
  marketplace: "/marketplace",
  buySell: "/buy-and-sell",
  housing: "/housing",
  rideshare: "/rideshare",
  lostFound: "/lost-and-found",
  atlas: "/atlas",
  capsule: "/capsule",
  academics: "/academics",
  courses: "/courses",
  articles: "/articles",
  ai: "/ai",
  developer: "/developer",
  streaks: "/streaks",
  saved: "/saved",
  settings: "/settings",
  safety: "/safety",
  help: "/help",
  more: "/more",
} as const;

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "home",
    group: "Home",
    items: [
      { icon: Home, href: ROUTES.home, label: "Home", desc: "Posts from your campus" },
      { icon: Compass, href: ROUTES.explore, label: "Explore", desc: "Trending posts, tags and people" },
      { icon: Bell, href: ROUTES.notifications, label: "Notifications", desc: "Replies, likes and mentions" },
    ],
  },
  {
    id: "campus",
    group: "Campus",
    items: [
      {
        icon: Users,
        href: ROUTES.communities,
        label: "Communities",
        desc: "Clubs and groups at your college",
      },
      { icon: Calendar, href: ROUTES.events, label: "Events", desc: "Fests, hackathons and workshops" },
      { icon: Flame, href: ROUTES.confessions, label: "Confessions", desc: "Say it without your name" },
      { icon: School, href: ROUTES.colleges, label: "Colleges", desc: "Find any college on CampusLoop" },
      { icon: Cake, href: ROUTES.birthdays, label: "Birthdays", desc: "Wish people born today" },
    ],
  },
  {
    id: "connect",
    group: "Connect",
    items: [
      { icon: MessageCircle, href: ROUTES.chat, label: "Chat", desc: "Your messages" },
      {
        icon: Heart,
        href: ROUTES.match,
        label: "Campus Match",
        desc: "Meet students who like what you like",
      },
      {
        icon: Lock,
        href: ROUTES.crush,
        label: "Secret Crush",
        desc: "You both find out only if it's mutual",
      },
      {
        icon: Zap,
        href: ROUTES.random,
        label: "Random chat",
        desc: "Talk to a verified student you haven't met",
        beta: true,
      },
      {
        icon: Gamepad2,
        href: ROUTES.gaming,
        label: "Gaming",
        desc: "Find teammates and join tournaments",
        beta: true,
      },
    ],
  },
  {
    id: "utilities",
    group: "Utilities",
    items: [
      {
        icon: LayoutGrid,
        href: ROUTES.living,
        label: "Campus living",
        desc: "Everything for life around campus",
      },
      {
        icon: ShoppingBag,
        href: ROUTES.marketplace,
        label: "Marketplace",
        desc: "Order from campus shops",
        beta: true,
      },
      { icon: Tag, href: ROUTES.buySell, label: "Buy and sell", desc: "Books, cycles and hostel stuff" },
      {
        icon: Building2,
        href: ROUTES.housing,
        label: "Housing",
        desc: "Rooms, PGs and flatmates near campus",
      },
      {
        icon: Car,
        href: ROUTES.rideshare,
        label: "Ride share",
        desc: "Split a cab to the station or airport",
      },
      {
        icon: PackageSearch,
        href: ROUTES.lostFound,
        label: "Lost and found",
        desc: "Lost your ID card? Post it here",
      },
      {
        icon: MapIcon,
        href: ROUTES.atlas,
        label: "Campus Atlas",
        desc: "Ask about clubs, places and timings",
        beta: true,
      },
      {
        icon: Hourglass,
        href: ROUTES.capsule,
        label: "Time capsule",
        desc: "Notes for your batch, opened later",
        beta: true,
      },
    ],
  },
  {
    id: "learn",
    group: "Learn",
    items: [
      {
        icon: GraduationCap,
        href: ROUTES.academics,
        label: "Study material",
        desc: "Notes, PYQs and syllabus",
      },
      {
        icon: PlayCircle,
        href: ROUTES.courses,
        label: "Courses",
        desc: "Free courses from colleges and creators",
      },
      { icon: BookOpen, href: ROUTES.articles, label: "Articles", desc: "Placement guides and long reads" },
      {
        icon: Sparkles,
        href: ROUTES.ai,
        label: "Ask CampusLoop",
        desc: "Ask questions about campus life",
        beta: true,
      },
      {
        icon: Terminal,
        href: ROUTES.developer,
        label: "Developers",
        desc: "API keys and MCP for your tools",
        beta: true,
      },
    ],
  },
  {
    id: "you",
    group: "You",
    items: [
      { icon: User, href: ROUTES.profile, label: "Profile", desc: "Your posts and info" },
      { icon: Flame, href: ROUTES.streaks, label: "Streaks", desc: "Your daily streak and Loop Points" },
      { icon: Bookmark, href: ROUTES.saved, label: "Saved", desc: "Posts you saved" },
      { icon: Settings, href: ROUTES.settings, label: "Settings", desc: "Account, privacy and alerts" },
      { icon: ShieldCheck, href: ROUTES.safety, label: "Safety", desc: "Community rules and reporting" },
      { icon: HelpCircle, href: ROUTES.help, label: "Help", desc: "Questions and contact" },
    ],
  },
];

/** Other apps by the CampusLoop team. Shown on the More page, not in the drawer. */
export const EXTERNAL_PRODUCTS: NavItem[] = [
  {
    icon: Terminal,
    href: "https://dsaloop.campusloop.space",
    label: "DSALoop",
    desc: "Practice coding interview questions",
    external: true,
  },
  {
    icon: Heart,
    href: "https://baby.campusloop.space",
    label: "baby",
    desc: "A private journal",
    external: true,
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

function pick(...hrefs: string[]): NavItem[] {
  return hrefs.map((href) => {
    const item = ALL_ITEMS.find((i) => i.href === href);
    if (!item) throw new Error(`navigation: ${href} is not in NAV_GROUPS`);
    return item;
  });
}

/** Desktop sidebar: the few places people go daily. Everything else is behind More. */
export const DESKTOP_NAV_ITEMS: NavItem[] = [
  ...pick(
    ROUTES.home,
    ROUTES.explore,
    ROUTES.chat,
    ROUTES.communities,
    ROUTES.events,
    ROUTES.academics,
    ROUTES.match
  ),
  { icon: LayoutGrid, href: ROUTES.more, label: "More" },
];

/**
 * Mobile bottom tab bar. Exactly five; Post is the violet centre sticker.
 * Profile's href is swapped for `/@username` at render time when signed in.
 */
export const MOBILE_BOTTOM_ITEMS: NavItem[] = [
  { icon: Home, href: ROUTES.home, label: "Home" },
  { icon: Compass, href: ROUTES.explore, label: "Explore" },
  { icon: Plus, href: ROUTES.newPost, label: "Post" },
  { icon: MessageCircle, href: ROUTES.chat, label: "Chat" },
  { icon: User, href: ROUTES.profile, label: "Profile" },
];

/** Mobile drawer: every group, in order. */
export const DRAWER_SECTIONS: NavGroup[] = NAV_GROUPS;

/** More page: every group except Home (already in the tab bar), plus other apps. */
export const MORE_HUB_SECTIONS: NavGroup[] = [
  ...NAV_GROUPS.filter((g) => g.id !== "home"),
  { id: "other", group: "Other apps", items: EXTERNAL_PRODUCTS },
];

/** Features still being tested. */
export const BETA_HUB_ITEMS: NavItem[] = ALL_ITEMS.filter((i) => i.beta).map((i) => ({
  ...i,
  badge: i.badge ?? "Beta",
  badgeTone: i.badgeTone ?? "neutral",
}));

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
      {
        href: "/admin",
        label: "Inbox",
        icon: Inbox,
        desc: "Everything waiting for a decision",
        keywords: ["dashboard", "pending", "requests", "todo"],
      },
      {
        href: "/admin/review",
        label: "Review queue",
        icon: ShieldAlert,
        desc: "Posts held by the safety filter",
        keywords: ["moderation", "flagged"],
      },
      {
        href: "/admin/reports",
        label: "Reports",
        icon: ShieldAlert,
        desc: "Content reported by students",
        keywords: ["abuse", "flags"],
      },
      {
        href: "/admin/confessions",
        label: "Confessions",
        icon: Ghost,
        desc: "Anonymous posts and identity reveals",
        keywords: ["anonymous"],
      },
      {
        href: "/admin/oauth-apps",
        label: "Developer apps",
        icon: KeyRound,
        desc: "Login with CampusLoop apps",
        keywords: ["oauth", "oidc", "login with campusloop", "clients"],
      },
    ],
  },
  {
    title: "People and campuses",
    items: [
      {
        href: "/admin/users",
        label: "Users",
        icon: Users,
        desc: "Search, verify, suspend or ban accounts",
        keywords: ["students", "ban"],
      },
      {
        href: "/admin/colleges",
        label: "Colleges",
        icon: School,
        desc: "Campus hubs and email domains",
        keywords: ["institutions", "hubs"],
      },
      {
        href: "/admin/outreach",
        label: "Outreach",
        icon: Mail,
        desc: "College contacts and campaigns",
        keywords: ["email", "campaign"],
      },
      {
        href: "/admin/broadcasts",
        label: "Broadcasts",
        icon: Megaphone,
        desc: "Banners shown on campus feeds",
        keywords: ["announcement"],
      },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/posts", label: "Posts", icon: FileText, desc: "All posts across campuses" },
      { href: "/admin/comments", label: "Comments", icon: MessageSquare, desc: "All comments" },
      {
        href: "/admin/academics",
        label: "Study material",
        icon: BookOpen,
        desc: "Notes and PYQs",
        keywords: ["notes", "pyq", "vault"],
      },
      {
        href: "/admin/feed",
        label: "Feed boosts",
        icon: TrendingUp,
        desc: "Pin and boost posts in feeds",
        keywords: ["curation", "pin"],
      },
      {
        href: "/admin/composio",
        label: "Reddit import",
        icon: Zap,
        desc: "Import campus subreddit discussions",
        keywords: ["reddit", "ingestion", "composio"],
      },
      {
        href: "/admin/links",
        label: "Short links",
        icon: Link2,
        desc: "campusloop.space/s/ links and referral clicks",
        keywords: ["referral", "utm"],
      },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { href: "/admin/marketplace", label: "Overview", icon: ShoppingBag, desc: "Orders and revenue" },
      { href: "/admin/marketplace/merchants", label: "Merchants", icon: Store, desc: "Campus shops" },
      {
        href: "/admin/marketplace/products",
        label: "Products",
        icon: UtensilsCrossed,
        desc: "Menus and listings",
      },
      { href: "/admin/marketplace/rentals", label: "Bike rentals", icon: Bike, desc: "Rental fleet" },
    ],
  },
  {
    title: "Insights",
    items: [
      {
        href: "/admin/analytics",
        label: "Analytics",
        icon: Activity,
        desc: "Growth and engagement",
        keywords: ["metrics", "dau"],
      },
      {
        href: "/admin/experiments",
        label: "Experiments",
        icon: FlaskConical,
        desc: "Feed ranking A/B results",
        keywords: ["ab test", "ranking"],
      },
      {
        href: "/admin/system",
        label: "System health",
        icon: Server,
        desc: "Database, cache and edge checks",
        keywords: ["status", "diagnostics"],
      },
      {
        href: "/admin/audit",
        label: "Audit log",
        icon: ScrollText,
        desc: "Every admin action",
        keywords: ["history"],
      },
    ],
  },
];

/**
 * Old or duplicate paths and where they should go (permanent).
 * Kept here so the route map and the redirect list never drift apart;
 * next.config.ts can map these into `redirects()`.
 */
export const LEGACY_ROUTE_REDIRECTS: { source: string; destination: string }[] = [
  { source: "/ride-share", destination: ROUTES.rideshare },
  { source: "/housing-and-flats", destination: ROUTES.housing },
  { source: "/gaming-arena", destination: ROUTES.gaming },
  { source: "/streak", destination: ROUTES.streaks },
  { source: "/discover", destination: ROUTES.explore },
  { source: "/search", destination: ROUTES.explore },
  { source: "/utilities", destination: ROUTES.living },
  { source: "/campus", destination: ROUTES.living },
  { source: "/hub", destination: ROUTES.living },
  { source: "/ecosystem", destination: ROUTES.more },
  { source: "/dating", destination: ROUTES.match },
  { source: "/dating/discover", destination: ROUTES.match },
  { source: "/dating/:path(filters|likes|matches|requests|settings)", destination: `${ROUTES.match}/:path` },
];

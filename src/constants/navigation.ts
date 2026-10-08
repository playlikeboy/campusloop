import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Cake,
  Calendar,
  Car,
  Gamepad2,
  HelpCircle,
  Hourglass,
  MoreHorizontal,
  School,
  Sliders,
  Terminal,
} from "lucide-react";
import {
  AnimateBookmark,
  AnimateBookOpen,
  AnimateCalendar,
  AnimateCompass,
  AnimateFlame,
  AnimateGraduationCap,
  AnimateHeart,
  AnimateHouse,
  AnimateLock,
  AnimateMessageCircle,
  AnimatePlus,
  AnimateSearch,
  AnimateShieldCheck,
  AnimateShoppingBag,
  AnimateUser,
  AnimateUsers,
  AnimateZap,
} from "@/components/ui/animated-icon";

export interface NavItem {
  icon: LucideIcon | React.ComponentType<any>;
  href: string;
  label: string;
  desc?: string;
  badge?: string;
  badgeColor?: string;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const DESKTOP_NAV_ITEMS: NavItem[] = [
  { icon: AnimateHouse, href: "/feeds", label: "Home" },
  {
    icon: AnimateGraduationCap,
    href: "/academics",
    label: "Notes & PYQs",
  },
  { icon: AnimateUsers, href: "/communities", label: "Communities" },
  {
    icon: AnimateCalendar,
    href: "/events",
    label: "Events",
  },
  { icon: Building2, href: "/campus", label: "Campus" },
  { icon: AnimateMessageCircle, href: "/chat", label: "Chat" },
  { icon: AnimateUser, href: "/profile", label: "Profile" },
];

// Mobile bottom navigation has 5 core tabs conforming to AGENTS.md Rule 6:
// Home (/feeds), Colleges (/colleges), Post (/post/new), Chat (/chat), and Dating (/dating).
export const MOBILE_BOTTOM_ITEMS: NavItem[] = [
  { icon: AnimateHouse, href: "/feeds", label: "Home" },
  { icon: AnimateGraduationCap, href: "/colleges", label: "Colleges" },
  { icon: AnimatePlus, href: "/post/new", label: "Post" },
  { icon: AnimateMessageCircle, href: "/chat", label: "Chat" },
  { icon: AnimateHeart, href: "/dating", label: "Dating" },
];

export const BETA_HUB_ITEMS: NavItem[] = [
  {
    icon: AnimateShoppingBag,
    href: "/marketplace",
    label: "Campus Marketplace",
    desc: "Buy, sell dorm essentials, books, cycles & order from campus canteens",
    badge: "BETA",
    badgeColor: "bg-amber-500/15 text-amber-500 border border-amber-500/30",
  },
  {
    icon: AnimateZap,
    href: "/random",
    label: "Random Loop",
    desc: "Meet someone unexpected. Instant real-time serendipitous chat with verified peers",
    badge: "BETA",
    badgeColor: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  },
  {
    icon: Hourglass,
    href: "/capsule",
    label: "Time Capsule",
    desc: "Batch memory vault locked until convocation & landmark dates",
    badge: "VAULT",
    badgeColor: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30",
  },
  {
    icon: Gamepad2,
    href: "/gaming",
    label: "Gaming & Esports Arena",
    desc: "Campus BGMI, Valorant, FIFA tournaments & hostel gaming lobbies",
    badge: "ESPORTS",
    badgeColor: "bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30",
  },
  {
    icon: AnimateZap,
    href: "/ai",
    label: "Campus AI Assistant",
    desc: "Ask about campus fests, study roadmaps, hostel tips & navigate CampusLoop",
    badge: "AI",
    badgeColor: "bg-primary/15 text-primary border border-primary/30",
  },
  {
    icon: AnimateCompass,
    href: "/atlas",
    label: "CampusLoop Atlas",
    desc: "Sanity-powered agent that reasons over real campus clubs, schedules & multi-constraint queries",
    badge: "SANITY",
    badgeColor: "bg-red-500/15 text-red-500 border border-red-500/30",
  },
  {
    icon: Terminal,
    href: "/developer",
    label: "Developer & MCP Hub",
    desc: "Connect Cursor, Windsurf, Claude Desktop & AI agents via personal MCP server keys",
    badge: "MCP",
    badgeColor: "bg-primary/15 text-primary border border-primary/30",
  },
];

export const MORE_HUB_SECTIONS: NavGroup[] = [
  {
    group: "Core Campus Hubs",
    items: [
      {
        icon: AnimateGraduationCap,
        href: "/academics",
        label: "Academic Vault",
        desc: "Notes, PPTs, Books, PYQs, syllabus & branch study resources",
        badge: "+20 LP",
        badgeColor: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30",
      },
      {
        icon: AnimateFlame,
        href: "/confessions",
        label: "Campus Confessions",
        desc: "Unfiltered campus confessions, spicy scoops & secrets",
        badge: "HOT",
        badgeColor: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
      },
      {
        icon: AnimateUsers,
        href: "/communities",
        label: "Communities & Clubs",
        desc: "Student-created clubs, technical societies & campus interest groups",
        badge: "CLUBS",
        badgeColor: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
      },
      {
        icon: School,
        href: "/colleges",
        label: "Colleges Directory",
        desc: "1,350+ indexed Indian college hubs, rankings & hub request forms",
        badge: "1,350+",
        badgeColor: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
      },
    ],
  },
  {
    group: "Campus Living & Utilities",
    items: [
      {
        icon: Calendar,
        href: "/events",
        label: "Events, Fests & Hackathons",
        desc: "College fests, hackathons, workshops, recruitments & registrations",
        badge: "EVENTS",
        badgeColor: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
      },
      {
        icon: AnimateBookOpen,
        href: "/articles",
        label: "Articles & Roadmaps",
        desc: "Placement roadmaps, tech tutorials, interviews & campus long reads",
        badge: "READS",
        badgeColor: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
      },
      {
        icon: Building2,
        href: "/housing",
        label: "Housing & Flatmates",
        desc: "Verified student flatmates, hostel rooms, PGs & apartments near campus",
        badge: "PG & FLATS",
        badgeColor: "bg-orange-500/15 text-orange-400 border-orange-500/30",
      },
      {
        icon: AnimateSearch,
        href: "/lost-and-found",
        label: "Lost & Found Hub",
        desc: "Report and recover misplaced student ID cards, keys, earbuds & gadgets",
        badge: "RECOVERY",
        badgeColor: "bg-violet-500/15 text-violet-400 border-violet-500/30",
      },
      {
        icon: Car,
        href: "/rideshare",
        label: "Ride Share & Carpools",
        desc: "Split cabs to airport, railway stations, weekend trips & daily commutes",
        badge: "CAB",
        badgeColor: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
      },
      {
        icon: Cake,
        href: "/birthdays",
        label: "Campus Birthdays",
        desc: "Celebrate fellow classmates and batchmates born today",
        badge: "TODAY",
        badgeColor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
      },
      {
        icon: Hourglass,
        href: "/capsule",
        label: "Time Capsule",
        desc: "Batch memory vault locked until convocation & landmark dates",
        badge: "VAULT",
        badgeColor: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
      },
    ],
  },
  {
    group: "Social, Discovery & Fun",
    items: [
      {
        icon: AnimateFlame,
        href: "/confessions",
        label: "Campus Confessions",
        desc: "Unfiltered campus thoughts with sealed identity escrow",
        badge: "ANON",
        badgeColor: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      },
      {
        icon: AnimateLock,
        href: "/crush",
        label: "Secret Crush Vault",
        desc: "5-slot intent-hidden encrypted campus crush match vault",
        badge: "SECRET",
        badgeColor: "bg-pink-500/15 text-pink-400 border-pink-500/30",
      },
      {
        icon: AnimateZap,
        href: "/random",
        label: "Random Loop",
        desc: "Meet someone unexpected. Instant real-time serendipitous chat with verified peers",
        badge: "BETA",
        badgeColor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      },
      {
        icon: AnimateZap,
        href: "/ai",
        label: "Campus AI Assistant",
        desc: "Ask about campus fests, study roadmaps, hostel tips & navigate CampusLoop",
        badge: "AI",
        badgeColor: "bg-primary/15 text-primary border-primary/30",
      },
      {
        icon: Gamepad2,
        href: "/gaming",
        label: "Gaming & Esports Arena",
        desc: "Campus BGMI, Valorant, FIFA tournaments & hostel gaming lobbies",
        badge: "ESPORTS",
        badgeColor: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
      },
    ],
  },
  {
    group: "Account & Trust",
    items: [
      {
        icon: AnimateBookmark,
        href: "/saved",
        label: "Saved Posts",
        desc: "Your private vault of bookmarked posts, threads & resources",
      },
      {
        icon: Sliders,
        href: "/settings",
        label: "Settings & Privacy",
        desc: "Account privacy, notification preferences & verification",
      },
      {
        icon: Terminal,
        href: "/developer",
        label: "Developer & MCP Portal",
        desc: "Connect Cursor, Windsurf, Claude Desktop & AI agents via personal MCP keys",
        badge: "MCP",
        badgeColor: "bg-primary/15 text-primary border border-primary/30",
      },
      {
        icon: AnimateShieldCheck,
        href: "/safety",
        label: "Safety & Community Guidelines",
        desc: "Verified student network rules, identity escrow & moderation standards",
      },
      {
        icon: HelpCircle,
        href: "/contact",
        label: "Help & Feedback",
        desc: "Reach out to CampusLoop core team or apply to become a campus ambassador",
      },
    ],
  },
];
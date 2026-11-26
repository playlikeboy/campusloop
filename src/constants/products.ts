/**
 * Everything the CampusLoop team makes, in one list.
 * Read by the public /products page, the More page ("Other apps") and the
 * desktop right sidebar, so a new app is added here once.
 */

import type { LucideIcon } from "lucide-react";
import {
  BookOpenText,
  Briefcase,
  Clapperboard,
  Compass,
  GraduationCap,
  Heart,
  NotebookPen,
  PenTool,
  Rocket,
  Terminal,
} from "lucide-react";

export const OBSERVATORY_URL = "https://observatory.campusloop.space";

export type ProductGroup = "campus" | "studio";
export type ProductStatus = "live" | "beta";

export type ProductInfo = {
  id: string;
  name: string;
  /** One short line, shown everywhere the app is listed. */
  tagline: string;
  /** Two or three plain sentences for the /products card. */
  description: string;
  href: string;
  /** Host shown under the name, e.g. "atlas.campusloop.space". */
  host?: string;
  external?: boolean;
  icon: LucideIcon;
  group: ProductGroup;
  status: ProductStatus;
  /** Extra label such as "Open source". Beta apps get "Beta" automatically. */
  badge?: string;
  price: string;
  audience: string;
  highlights: string[];
};

export const PRODUCTS: ProductInfo[] = [
  {
    id: "app",
    name: "CampusLoop",
    tagline: "The social app for your college",
    description:
      "Campus feed, anonymous confessions, polls, stories, chat, events and study notes. Join with your college email and see what your campus is talking about.",
    href: "/feeds",
    icon: GraduationCap,
    group: "campus",
    status: "live",
    price: "Free for students",
    audience: "Students at Indian colleges",
    highlights: [
      "Feed, confessions, polls and stories from your campus",
      "Chat, communities, events and Secret Crush",
      "Notes, PYQs and free courses for your branch",
    ],
  },
  {
    id: "atlas",
    name: "CampusLoop Atlas",
    tagline: "Developer tools, APIs and AI agents, picked by hand",
    description:
      "A searchable list of more than 9,000 checked developer tools, open-source projects, public APIs and learning roadmaps. Find what to build with before your next hackathon.",
    href: "https://atlas.campusloop.space",
    host: "atlas.campusloop.space",
    external: true,
    icon: Compass,
    group: "campus",
    status: "live",
    price: "Free",
    audience: "Student developers and builders",
    highlights: [
      "9,000+ tools, APIs and open-source projects",
      "Roadmaps to learn a stack step by step",
      "AI agents and MCP servers in one place",
    ],
  },
  {
    id: "dsaloop",
    name: "DSALoop",
    tagline: "Get ready for coding interviews",
    description:
      "DSA practice by pattern, 185+ company question lists and a 28-chapter system design guide. One clean place to prepare for placements.",
    href: "https://dsaloop.campusloop.space",
    host: "dsaloop.campusloop.space",
    external: true,
    icon: Terminal,
    group: "campus",
    status: "live",
    price: "Free",
    audience: "Students preparing for placements",
    highlights: [
      "Questions grouped by pattern, not by random order",
      "185+ company-tagged question lists",
      "28 chapters of system design",
    ],
  },
  {
    id: "opportunities",
    name: "CampusLoop Opportunities",
    tagline: "Checked internships, hackathons and scholarships",
    description:
      "Internships, hackathons, scholarships, fellowships and research programs for Indian college students. Every listing links to the official organiser and shows the real deadline.",
    href: "https://opportunities.campusloop.space",
    host: "opportunities.campusloop.space",
    external: true,
    icon: Briefcase,
    group: "campus",
    status: "beta",
    price: "Free",
    audience: "Undergraduate and engineering students",
    highlights: [
      "Fresh deadlines, updated every day",
      "Official links only, checked for fake listings",
      "Internships, hackathons, scholarships and fellowships",
    ],
  },
  {
    id: "fillim",
    name: "Fillim",
    tagline: "Make short films with AI, in your browser",
    description:
      "A cloud film studio: write a script, generate shots on a canvas, edit them on a timeline and watch the cut. Nothing to install.",
    href: "https://fillim.campusloop.space",
    host: "fillim.campusloop.space",
    external: true,
    icon: Clapperboard,
    group: "campus",
    status: "beta",
    price: "Free while in beta",
    audience: "Student filmmakers, creators and clubs",
    highlights: [
      "Script, shots, edit and screening in one place",
      "Canvas for planning scenes",
      "Runs in the browser",
    ],
  },
  {
    id: "daksha",
    name: "Daksha",
    tagline: "An assistant that remembers your life",
    description:
      "Write things down or say them out loud, then ask Daksha about your own life. Every answer shows where it came from, and you can see, fix, download or delete everything.",
    href: "https://www.daksha.life",
    host: "daksha.life",
    external: true,
    icon: NotebookPen,
    group: "studio",
    status: "live",
    price: "Free to start",
    audience: "Anyone who wants a private memory",
    highlights: [
      "Notes by typing or by voice",
      "Answers with their sources",
      "Your data stays yours: export or delete any time",
    ],
  },
  {
    id: "sketchflow",
    name: "Sketchflow",
    tagline: "A canvas and notes that save to your GitHub",
    description:
      "Draw on a canvas with a notes editor beside it. Every save is a Git commit to a GitHub repository you own, as plain files.",
    href: "https://sketchflow.space",
    host: "sketchflow.space",
    external: true,
    icon: PenTool,
    group: "studio",
    status: "live",
    price: "Free to start",
    audience: "Developers, students and teams",
    highlights: [
      "Canvas and notes side by side",
      "Every save is a Git commit",
      "Plain files in your own repo",
    ],
  },
  {
    id: "indexfast",
    name: "IndexFast",
    tagline: "Get your new pages on Google and Bing faster",
    description:
      "Add your domain and host one key file. IndexFast sends new and changed pages to IndexNow, Bing, Yandex, Baidu and Search Console for you.",
    href: "https://indexfast.co",
    host: "indexfast.co",
    external: true,
    icon: Rocket,
    group: "studio",
    status: "live",
    price: "Free plan available",
    audience: "Site owners, bloggers and developers",
    highlights: [
      "Automatic submits to IndexNow, Bing and Search Console",
      "Set up in a few minutes",
      "REST API and MCP server on every plan",
    ],
  },
  {
    id: "baby",
    name: "baby",
    tagline: "A calm, private journal",
    description:
      "A quiet place for your thoughts, voice notes and memories. Free and private.",
    href: "https://baby.campusloop.space",
    host: "baby.campusloop.space",
    external: true,
    icon: Heart,
    group: "studio",
    status: "live",
    price: "Free",
    audience: "Anyone who journals",
    highlights: ["Text and voice notes", "Private by default", "Free"],
  },
  {
    id: "observatory",
    name: "Digital Observatory",
    tagline: "Open-source writing about tech and the web",
    description:
      "An open-source site that explains what is changing in tech, the internet and AI, with sources for every claim.",
    href: OBSERVATORY_URL,
    host: "observatory.campusloop.space",
    external: true,
    icon: BookOpenText,
    group: "studio",
    status: "live",
    badge: "Open source",
    price: "Free and public",
    audience: "Developers, students and curious readers",
    highlights: ["Articles that link their sources", "Open source, written in Markdown", "RSS feed"],
  },
];

/** Every app except the CampusLoop app itself. */
export const OTHER_PRODUCTS = PRODUCTS.filter((p) => p.id !== "app");

export const PRODUCT_GROUPS: { id: ProductGroup; title: string; lede: string }[] = [
  {
    id: "campus",
    title: "For your campus",
    lede: "Apps for college life, placements and projects.",
  },
  {
    id: "studio",
    title: "More from our team",
    lede: "Tools we built for writing, thinking and shipping.",
  },
];

export function productBadge(p: ProductInfo): string | undefined {
  return p.status === "beta" ? "Beta" : p.badge;
}

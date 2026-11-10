import { ACADEMICS_AND_MARKETPLACE } from "./entries/academics-and-marketplace";
import { ACCOUNT_AND_PLATFORM } from "./entries/account-and-platform";
import { CONNECT_AND_CAMPUS } from "./entries/connect-and-campus";
import { START_AND_SOCIAL } from "./entries/start-and-social";
import type { GuideCategory, GuideEntry } from "./types";

export { SITE_URL } from "@/lib/seo/constants";
export type { GuideAudience, GuideCategory, GuideEntry } from "./types";

export const GUIDE_CATEGORIES: { name: GuideCategory; blurb: string }[] = [
  { name: "Start here", blurb: "Join, verify and find your way around." },
  { name: "Social", blurb: "Feed, posts, confessions, stories and search." },
  { name: "Connect", blurb: "Chat, calls, Campus Match and meeting new people." },
  { name: "Campus life", blurb: "Communities, events, colleges, gaming and more." },
  { name: "Academics", blurb: "Notes, PYQs, uploads and study playlists." },
  { name: "Marketplace & living", blurb: "Orders, payments, rentals, housing and travel." },
  { name: "Account & safety", blurb: "Points, notifications, privacy and safety." },
  { name: "Platform", blurb: "How ranking works, developer access and admin tools." },
];

export const GUIDES: GuideEntry[] = [
  ...START_AND_SOCIAL,
  ...CONNECT_AND_CAMPUS,
  ...ACADEMICS_AND_MARKETPLACE,
  ...ACCOUNT_AND_PLATFORM,
];

export function getGuide(slug: string): GuideEntry | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function getGuidesByCategory(category: GuideCategory): GuideEntry[] {
  return GUIDES.filter((g) => g.category === category);
}

export function getGuideSlugs(): string[] {
  return GUIDES.map((g) => g.slug);
}

export function latestGuideUpdate(): string {
  return (
    GUIDES.map((g) => g.updated)
      .sort()
      .at(-1) ?? ""
  );
}

/** The whole product in a few paragraphs, shared by /guide, /investors and /llms.txt. */
export const PRODUCT_OVERVIEW = {
  oneLiner: "CampusLoop is a student-only app for Indian colleges. You join with your college email.",
  what: "Students join with their college email. Each campus gets its own space: a feed of posts, polls and anonymous confessions, chat and calls, Campus Match, clubs and events, free notes and past papers, and a campus marketplace for food, laundry, rentals and more. You can switch from your campus to all of India any time.",
  why: "College life runs on dozens of WhatsApp groups, Instagram confession pages, Google Drive folders and calls to the canteen. Things get lost, outsiders get in, and nothing is searchable. CampusLoop puts it all in one place per campus, open only to students.",
  forWhom: [
    "Students: daily social life, study material, dating, services.",
    "Aspirants: Campus Preview, to see real campus life before choosing a college.",
    "Clubs and organisers: communities, events, ticketing and check-in.",
    "Campus merchants: a digital storefront, order queue and online payments.",
    "Developers: Login with CampusLoop, an API and MCP access.",
  ],
  principles: [
    "Only students: you join with a college email.",
    "Your campus first, all of India one tap away.",
    "Anonymous posts stay anonymous, but abuse can still be acted on.",
    "Your phone number is never shared and your location is never shown.",
    "You can see why posts rank, or switch to newest first.",
  ],
  stack:
    "Next.js App Router on Cloudflare Workers, Neon PostgreSQL with Drizzle ORM, Hexclave auth, Upstash Redis, Qdrant vector search with PostgreSQL fallback, Razorpay payments, peer-to-peer WebRTC calls.",
};

export const INVESTOR_POINTS = {
  problem:
    "Over 43 million students in Indian higher education (AISHE 2021-22) run campus life on scattered, open tools. None of them combine trust, campus scope, study material and commerce.",
  solution:
    "A student-only network per campus: the daily habit (feed, chat, Campus Match) plus the useful layer (notes, services, payments).",
  moats: [
    "Verified identity per campus: a closed graph that open platforms cannot replicate.",
    "Campus-by-campus network effects: each new student makes the feed, Vault, matches and marketplace better for their classmates.",
    "Compounding academic content: every upload helps every future batch and brings search traffic.",
    "Safety and moderation infrastructure that is costly to rebuild.",
    "Login with CampusLoop: an OpenID Connect provider that lets any website verify Indian college students in one tap, turning the verified graph into identity infrastructure other products build on.",
  ],
  revenue: [
    "Marketplace commission and delivery fees on campus orders, paid online through Razorpay.",
    "Merchant subscriptions and featured placement.",
    "Event ticketing and sponsorships; brand-sponsored tournaments and communities.",
    "Premium features for students (future) and recruitment or alumni products.",
  ],
  growth: [
    "Campus Preview brings in students a year before they enrol.",
    "Referral loops reward students for bringing classmates.",
    "The college directory is already built; hubs open on request.",
  ],
  measurement:
    "Ranking changes run as live A/B experiments with readouts on skip rate, reading time and replies, so product decisions are measured.",
};

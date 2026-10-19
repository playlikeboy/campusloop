import { ACADEMICS_AND_MARKETPLACE } from "./entries/academics-and-marketplace";
import { ACCOUNT_AND_PLATFORM } from "./entries/account-and-platform";
import { CONNECT_AND_CAMPUS } from "./entries/connect-and-campus";
import { START_AND_SOCIAL } from "./entries/start-and-social";
import type { GuideCategory, GuideEntry } from "./types";

export type { GuideAudience, GuideCategory, GuideEntry } from "./types";

export const SITE_URL = "https://campusloop.space";

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
  return GUIDES.map((g) => g.updated).sort().at(-1) ?? "";
}

/** The whole product in a few paragraphs, shared by /guide, /investors and /llms.txt. */
export const PRODUCT_OVERVIEW = {
  oneLiner: "CampusLoop is a verified, student-only social network and campus super-app for Indian colleges.",
  what:
    "Students join with their college email. Inside, each campus gets its own private network: a feed of posts, polls and anonymous confessions; chat and calls; Campus Match dating; communities and events; a free Academic Vault of notes and past papers; and a campus marketplace for food, groceries, laundry, rentals and more, with online payments. Students can switch from their campus to all of India at any time.",
  why:
    "Indian college life runs on dozens of WhatsApp groups, Instagram confession pages, Google Drives and phone calls to the canteen. Information disappears, outsiders get in, and nothing is searchable. CampusLoop replaces that with one verified, searchable, ranked home per campus.",
  forWhom: [
    "Students: daily social life, study material, dating, services.",
    "Aspirants: read-only Viewer Mode to see real campus life before choosing a college.",
    "Clubs and organisers: communities, events, ticketing and check-in.",
    "Campus merchants: a digital storefront, order queue and online payments.",
    "Developers: MCP and API access to campus knowledge from AI tools.",
  ],
  principles: [
    "Verified by default: college email at the door.",
    "Campus first, India one tap away.",
    "Anonymity with accountability: sealed identities, audited reveals.",
    "Privacy first: no phone numbers shared, location rounded and never shown.",
    "Transparent ranking with a chronological option.",
  ],
  stack:
    "Next.js App Router on Cloudflare Workers, Neon PostgreSQL with Drizzle ORM, Hexclave auth, Upstash Redis, Qdrant vector search with PostgreSQL fallback, Razorpay payments, peer-to-peer WebRTC calls.",
};

export const INVESTOR_POINTS = {
  problem:
    "40M+ students in Indian higher education coordinate campus life through fragmented, unverified tools. None of them combine trust, campus scope, academics and commerce.",
  solution:
    "A verified campus network that becomes the daily habit (feed, chat, dating) and the utility layer (notes, services, payments) for each college.",
  moats: [
    "Verified identity per campus: a closed graph that open platforms cannot replicate.",
    "Campus-by-campus network effects: each new student makes the feed, Vault, matches and marketplace better for their classmates.",
    "Compounding academic content: every upload helps every future batch and brings search traffic.",
    "Safety and moderation infrastructure that is costly to rebuild.",
  ],
  revenue: [
    "Marketplace commission and delivery fees on campus orders, paid online through Razorpay.",
    "Merchant subscriptions and featured placement.",
    "Event ticketing and sponsorships; brand-sponsored tournaments and communities.",
    "Premium features for students (future) and recruitment or alumni products.",
  ],
  growth: [
    "Aspirant Viewer Mode converts students a year before enrolment.",
    "Referral loops reward students for bringing classmates.",
    "1,350+ colleges already mapped; hubs open on request.",
  ],
  measurement:
    "Ranking changes run as live A/B experiments with readouts on skip rate, reading time and replies, so product decisions are measured.",
};

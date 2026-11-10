/**
 * CampusLoop product catalogue.
 * Displayed on the public /products page and linked from the marketing footer.
 */

export const OBSERVATORY_URL = "https://observatory.campusloop.space";

export type ProductInfo = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  href: string;
  external?: boolean;
  badge?: string;
  price: string;
  audience: string;
  highlights: string[];
};

export const PRODUCTS: ProductInfo[] = [
  {
    id: "app",
    name: "CampusLoop App",
    tagline: "The verified student-only campus network",
    description:
      "The CampusLoop platform for Indian colleges: anonymous confessions, polls, campus and global feeds, stories, chat, Campus Match, communities, marketplace and the Academic Vault, gated by college email verification.",
    href: "/feeds",
    badge: "Flagship",
    price: "Free for verified students",
    audience: "Students at Indian colleges; 1,350+ colleges in our directory",
    highlights: [
      "Campus feed with confessions, polls and reposts",
      "Stories, chat, Campus Match and Secret Crush",
      "Communities, marketplace, events and the Academic Vault",
      "Loop Points reputation and verified tiers",
    ],
  },
  {
    id: "observatory",
    name: "Digital Observatory",
    tagline: "Open-source research on digital systems and the web",
    description:
      "An open-source research publication for tracking, explaining and contextualising developments across technology, the internet, AI, platforms and digital infrastructure, with a strong focus on sources and provenance.",
    href: OBSERVATORY_URL,
    external: true,
    badge: "Open Source",
    price: "Free and public",
    audience: "Researchers, developers, students and curious builders",
    highlights: [
      "Research-driven articles with source and provenance context",
      "Open-source, Markdown-first publishing architecture",
      "SEO-friendly static publishing with RSS and machine-readable feeds",
      "Built for transparent, community-friendly technical research",
    ],
  },
];

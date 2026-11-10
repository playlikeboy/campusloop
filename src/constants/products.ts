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
    tagline: "The app for your college",
    description:
      "Feed, confessions, polls, stories, chat, Campus Match, clubs, a campus store and study notes. You join with your college email.",
    href: "/feeds",
    price: "Free for students",
    audience: "Students at Indian colleges",
    highlights: [
      "Campus feed with confessions, polls and reposts",
      "Stories, chat, Campus Match and Secret Crush",
      "Clubs, campus store, events and study notes",
      "Loop Points for helping others",
    ],
  },
  {
    id: "observatory",
    name: "Digital Observatory",
    tagline: "Open-source writing about tech and the web",
    description:
      "An open-source site that explains what is changing in tech, the internet and AI, with sources for every claim.",
    href: OBSERVATORY_URL,
    external: true,
    badge: "Open Source",
    price: "Free and public",
    audience: "Researchers, developers, students and curious builders",
    highlights: [
      "Articles that link their sources",
      "Open source and written in Markdown",
      "RSS feed you can follow",
    ],
  },
];

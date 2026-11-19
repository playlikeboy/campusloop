import { ANONYMITY_STATEMENT, COMPLIANCE_LINE } from "@/constants/landing";

/**
 * Landing copy. Plain words, short lines, and only things the product does today.
 * Live counts come from getPublicStats() and are never written here.
 */

export const HERO = {
  /** The headline is set in two lines; the second sits on a white sticker. */
  titleLead: "Your campus.",
  titleSticker: "Only your campus.",
  lead: "Confessions, polls, events and notes from students at your college. Sign up with your college email to get in.",
  cta: "Join with college email",
} as const;

/** What lives on CampusLoop, as the running tape under the hero. Each word is a real section. */
export const TAPE_WORDS = [
  { label: "Confessions", href: "/confessions" },
  { label: "Polls", href: "/feeds" },
  { label: "Fests", href: "/events" },
  { label: "Notes", href: "/academics" },
  { label: "Past papers", href: "/academics" },
  { label: "Clubs", href: "/communities" },
  { label: "Free courses", href: "/courses" },
  { label: "Campus Match", href: "/matching" },
] as const;

/** The safety promise, one fact per line. Wording matches what the product does today. */
export const SAFETY_POINTS: ReadonlyArray<readonly [string, string]> = [
  [
    "College email to get in",
    "You sign up with your college email, so the people here are students from your college.",
  ],
  ["No name on anonymous posts", "Anonymous posts never show your name to anyone."],
  [
    "Three reports hide a post",
    "Every post has a report button, and three reports hide it until a person checks it, within 24 hours.",
  ],
];

export const SAFETY_COMPLIANCE = COMPLIANCE_LINE;

export const FAQS: ReadonlyArray<readonly [string, string]> = [
  [
    "Who can join?",
    "Any college student. Sign up with your college email to post, vote and chat. With a personal email you can still look around in read-only Campus Preview.",
  ],
  ["Can anyone see who wrote an anonymous post?", ANONYMITY_STATEMENT],
  ["Is it free?", "Yes, joining is free. Notes, past papers and courses are free to open too."],
  [
    "Do courses give a certificate?",
    "Yes. Finish every lecture and you get a CampusLoop certificate with a link you can add to LinkedIn. CampusLoop issues it, not the university or the creator.",
  ],
  [
    "Who can use Campus Match?",
    "Only verified students aged 18 or over. You only see that someone liked you when you like them back.",
  ],
  [
    "My college isn't listed. What now?",
    "Search for it on this page. If it isn't there, send a request and we'll look at adding it.",
  ],
];

import type { SearchIntent } from "./types";

const COMMON_CORRECTIONS: Record<string, string> = {
  hackthon: "hackathon",
  internshp: "internship",
  internshps: "internships",
  placment: "placement",
  placments: "placements",
  confesion: "confession",
  confesions: "confessions",
  comunity: "community",
  comunities: "communities",
  cancanteen: "canteen",
  cantene: "canteen",
  acadmics: "academics",
  notesx: "notes",
  sylabus: "syllabus",
  subjet: "subject",
  colleg: "college",
  collg: "college",
  hostle: "hostel",
  festt: "fest",
};

export function detectSearchIntent(query: string): SearchIntent {
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();

  // Typo check
  let didYouMean: string | undefined;
  const words = lower.split(/\s+/);
  const correctedWords = words.map((w) => COMMON_CORRECTIONS[w] || w);
  if (correctedWords.join(" ") !== lower) {
    didYouMean = correctedWords.join(" ");
  }

  // Exact symbol classification
  if (trimmed.startsWith("@")) {
    return {
      primaryType: "PEOPLE",
      badge: "Student Profile",
      suggestedAction: `Search student profile for ${trimmed.slice(1)}`,
      didYouMean,
    };
  }

  if (trimmed.startsWith("#")) {
    return {
      primaryType: "HASHTAGS",
      badge: "Trending Hashtag",
      suggestedAction: `Explore tag ${trimmed}`,
      didYouMean,
    };
  }

  // Academics keywords: notes, pyq, exam, syllabus, assignment, module, semester, cs101, etc.
  if (
    /\b(notes?|pyqs?|syllabus|midsem|endsem|lab|manual|exam|formula|cheat\s*sheet|slides?|cs\d+|ec\d+|me\d+|ee\d+)\b/i.test(
      lower
    )
  ) {
    return {
      primaryType: "ACADEMICS",
      badge: "Academic Vault",
      suggestedAction: "Search study notes, PYQs and syllabus",
      didYouMean,
    };
  }

  // Events / Hackathons keywords: hackathon, fest, workshop, meetup, competition, registration
  if (/\b(hackathons?|fests?|workshops?|meetups?|webinars?|registrations?|competitions?)\b/i.test(lower)) {
    return {
      primaryType: "EVENTS",
      badge: "Campus Events",
      suggestedAction: "Explore campus hackathons and fests",
      didYouMean,
    };
  }

  // Marketplace / Stores keywords: canteen, food, maggi, chai, store, shop, rental, cycle, bike, buy, sell
  if (/\b(canteens?|stores?|shops?|rentals?|cycles?|bikes?|laundry|barbers?|mess|food|burgers?|rolls?)\b/i.test(lower)) {
    return {
      primaryType: "MARKETPLACE",
      badge: "Campus Stores",
      suggestedAction: "Browse campus shops, canteens and rentals",
      didYouMean,
    };
  }

  // Communities / Clubs keywords: club, society, team, guild, chapter
  if (/\b(clubs?|societ(y|ies)|chapters?|guilds?|acm|ieee|rotaract|gdsc|edc)\b/i.test(lower)) {
    return {
      primaryType: "COMMUNITIES",
      badge: "Clubs & Communities",
      suggestedAction: "Find student clubs and chapters",
      didYouMean,
    };
  }

  // Articles / Roadmaps keywords: roadmap, interview, preparation, experience, how to
  if (/\b(roadmaps?|interviews?|experiences?|guides?|articles?|how\s+to|placement\s+prep)\b/i.test(lower)) {
    return {
      primaryType: "ARTICLES",
      badge: "Articles & Reads",
      suggestedAction: "Read placement roadmaps and student articles",
      didYouMean,
    };
  }

  // Colleges keywords: iit, nit, iiit, bit, university, campus, institute, college
  if (/\b(iit|nit|iiit|bits?|university|campuses?|institutes?|colleges?)\b/i.test(lower)) {
    return {
      primaryType: "COLLEGES",
      badge: "Colleges Directory",
      suggestedAction: "Search Indian universities and college hubs",
      didYouMean,
    };
  }

  return {
    primaryType: "ALL",
    didYouMean,
  };
}

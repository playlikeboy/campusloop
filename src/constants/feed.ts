export const FEED_SORT_TABS = [
  { id: "for_you", label: "For you" },
  { id: "trending", label: "Trending" },
  { id: "confessions", label: "Confessions" },
  { id: "memes", label: "Memes" },
  { id: "latest", label: "Latest" },
  { id: "most_discussed", label: "Most comments" },
  { id: "top_voted", label: "Most votes" },
] as const;

export const FEED_VISIBILITY_OPTIONS = [
  { id: "all", label: "Everyone" },
  { id: "anonymous", label: "Anonymous only" },
  { id: "public", label: "Named only" },
] as const;

export const FEED_CATEGORY_OPTIONS = [
  { id: "ALL", label: "All" },
  { id: "MEME", label: "Memes" },
  { id: "CONFESSION", label: "Confessions" },
  { id: "POLL", label: "Polls" },
] as const;

export const FEED_SCOPE_OPTIONS = [
  { id: "CAMPUS", label: "My college" },
  { id: "GLOBAL", label: "All colleges" },
] as const;

export const MAX_POST_CHARS = 2000;
export const DEFAULT_FEED_PAGE_LIMIT = 20;

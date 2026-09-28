export interface GifPopularTag {
  id: string;
  label: string;
  query: string;
}

export const GIF_POPULAR_TAGS: GifPopularTag[] = [
  { id: "trending", label: "Trending", query: "" },
  { id: "reactions", label: "Reactions", query: "reaction meme" },
  { id: "tea", label: "Tea", query: "spilling tea drama" },
  { id: "exam", label: "Exam", query: "exam studying stressed" },
  { id: "lol", label: "LOL", query: "laughing meme" },
  { id: "shocked", label: "Shocked", query: "shocked reaction" },
  { id: "party", label: "Celebration", query: "college party celebration dance" },
  { id: "crush", label: "Crush", query: "crush flirt romantic" },
  { id: "tired", label: "Sleepy", query: "tired sleepy morning" },
  { id: "agree", label: "Facts", query: "agree yes nod facts" },
];

export const GIF_FALLBACK_QUERY = "college meme reaction";
export const DEFAULT_GIF_PAGE_LIMIT = 24;

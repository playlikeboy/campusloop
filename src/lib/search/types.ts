export type SearchEntityType =
  | "person"
  | "post"
  | "article"
  | "community"
  | "college"
  | "event"
  | "academic"
  | "store"
  | "hashtag"
  | "reel";

export interface SearchResult {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string | null;
  href: string;
  metadata?: Record<string, string>;
  score?: number;
}

export type SearchScope = "CAMPUS" | "INDIA" | "GLOBAL";

export type SearchCategoryFilter =
  | "ALL"
  | "PEOPLE"
  | "POSTS"
  | "COMMUNITIES"
  | "PLACES"
  | "EVENTS"
  | "ACADEMICS"
  | "ARTICLES"
  | "MARKETPLACE"
  | "COLLEGES"
  | "HASHTAGS";

export interface SearchIntent {
  primaryType?: SearchCategoryFilter;
  badge?: string;
  didYouMean?: string;
  suggestedAction?: string;
}

export interface SearchApiResponse {
  query: string;
  scope: SearchScope;
  filter: SearchCategoryFilter;
  intent?: SearchIntent;
  total: number;
  results: SearchResult[];
  grouped?: Record<string, SearchResult[]>;
  // Backward compatibility keys
  posts?: any[];
  colleges?: any[];
  users?: any[];
  communities?: any[];
  merchants?: any[];
  academics?: any[];
  playlists?: any[];
  events?: any[];
  articles?: any[];
}

export interface SearchSuggestionItem {
  text: string;
  type: "query" | "person" | "community" | "college" | "hashtag" | "academic";
  title?: string;
  subtitle?: string;
  href?: string;
  imageUrl?: string | null;
}

export interface SearchSuggestionsResponse {
  query: string;
  suggestions: SearchSuggestionItem[];
}

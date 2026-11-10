/** Shared option lists for the study material filters. */

export const BRANCHES = [
  "All",
  "Computer Science",
  "Information Technology",
  "ECE",
  "Electrical",
  "Mechanical",
  "Civil",
  "Chemical",
  "BioTech",
  "Basic Sciences",
] as const;

export const SEMESTERS = [
  { id: "all", label: "All semesters" },
  { id: "1", label: "Sem 1" },
  { id: "2", label: "Sem 2" },
  { id: "3", label: "Sem 3" },
  { id: "4", label: "Sem 4" },
  { id: "5", label: "Sem 5" },
  { id: "6", label: "Sem 6" },
  { id: "7", label: "Sem 7" },
  { id: "8", label: "Sem 8" },
] as const;

export const RESOURCE_TYPES = [
  { id: "all", label: "All types" },
  { id: "NOTES", label: "Notes" },
  { id: "PYQ", label: "PYQs (past papers)" },
  { id: "CHEAT_SHEET", label: "Formula sheets" },
  { id: "LAB_MANUAL", label: "Lab manuals" },
  { id: "SYLLABUS", label: "Syllabus" },
] as const;

export const SORT_OPTIONS = [
  { id: "for_you", label: "For you" },
  { id: "trending", label: "Popular now" },
  { id: "latest", label: "Newest" },
  { id: "popular", label: "Most upvoted" },
  { id: "downloads", label: "Most downloaded" },
] as const;

export const branchLabel = (b: string) => (b === "All" ? "All branches" : b);

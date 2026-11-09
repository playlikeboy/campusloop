/** Page size shared by the server-rendered directory and the client fetcher so `?page=N` means the same rows in both. */
export const COLLEGES_PAGE_SIZE = 50;

export const COLLEGE_DIRECTORY_STATES = [
  "Delhi",
  "Maharashtra",
  "Karnataka",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal",
  "Gujarat",
  "Rajasthan",
  "Punjab",
  "Kerala",
  "Jharkhand",
  "Madhya Pradesh",
  "Odisha",
  "Bihar",
  "Assam",
  "Haryana",
  "Andhra Pradesh",
] as const;

/** Builds the `/colleges` URL for a page and optional state filter; `undefined` keys are dropped. */
export function collegesHref(params: { page?: number; state?: string | null }): string {
  const search = new URLSearchParams();
  if (params.state && params.state !== "ALL") search.set("state", params.state);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `/colleges?${query}` : "/colleges";
}

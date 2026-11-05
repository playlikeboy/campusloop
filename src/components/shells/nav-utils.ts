/** Shared active-route matching so sidebar, drawer and bottom bar never disagree. */
export function isPathActive(pathname: string, href: string) {
  if (href.startsWith("http")) return false;
  if (href === "/feeds") return pathname === "/feeds" || pathname === "/";
  if (href === "/post/new") return pathname === "/post/new";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Routes with their own full-screen flows where the mobile bottom bar would cover controls. */
export const HIDE_BOTTOM_NAV_PREFIXES = [
  "/chat/",
  "/stories/new",
  "/story/",
  "/post/",
  "/academics/study-material/upload",
];

export function shouldHideBottomNav(pathname: string) {
  return HIDE_BOTTOM_NAV_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function formatCount(count: number) {
  return count > 99 ? "99+" : String(count);
}

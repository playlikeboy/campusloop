import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

/** Shared active-route matching so sidebar, drawer and bottom bar never disagree. */
export function isPathActive(pathname: string, href: string) {
  if (href.startsWith("http")) return false;
  if (href === "/feeds") return pathname === "/feeds" || pathname === "/";
  if (href === "/post/new") return pathname === "/post/new";
  if (href === "/living") return ["/living", "/campus", "/utilities"].includes(pathname);
  if (href.startsWith("/@"))
    return pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith("/profile");
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

/** Tap sound plus light haptic, shared by every nav control. */
export function navPress() {
  sounds.tap();
  haptics.light();
}

/** Profile link for the signed-in user, falling back to /profile. */
export function profileHref(username?: string | null) {
  return username ? `/@${username}` : "/profile";
}

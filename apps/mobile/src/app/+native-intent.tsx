// Rewrites incoming deep links before Expo Router sees them.
// campusloop://oauth?code=… is the OAuth redirect: expo-web-browser's auth session
// consumes it (lib/auth.ts), so the router must stay where it is.
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string | null {
  try {
    if (/^(campusloop:\/\/|\/)?oauth(\/|\?|$)/.test(path)) return null;
    const event = path.match(/^(?:campusloop:\/\/|\/)?events\/([\w-]+)/);
    if (event) return `/event/${event[1]}`;
    return path;
  } catch {
    return "/";
  }
}

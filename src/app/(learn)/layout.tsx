import type { Metadata } from "next";

// The player repeats the public /courses/[slug] page, so it stays out of search.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

/**
 * Focus mode for watching lectures: no app navigation, feed widgets, chat or
 * notification prompts. Only the player renders here.
 */
export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-bg text-fg">{children}</div>;
}

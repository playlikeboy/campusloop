import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

/**
 * Distraction-free learning shell: no app navigation, feed widgets, chat or
 * notification prompts. Only the player renders here.
 */
export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-background">{children}</div>;
}

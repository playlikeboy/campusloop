"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

const HIDE_ON_ROUTES = ["/chat", "/stories/new", "/story/", "/post/", "/academics/study-material/upload"];

export function MobileFloatingCreateButton({ isViewer }: { isViewer?: boolean }) {
  const pathname = usePathname() || "/feeds";
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    // Start hidden on each route so a scroll on the previous page does not
    // leave the create action floating above the new page's first viewport.
    setHasScrolled(false);
    const updateVisibility = () => setHasScrolled(window.scrollY > 120);
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, [pathname]);

  if (isViewer || !hasScrolled || HIDE_ON_ROUTES.some((route) => pathname.startsWith(route))) {
    return null;
  }

  return (
    <Link
      href="/post/new"
      prefetch
      aria-label="Create a post or story"
      title="Create a post"
      className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-50 flex size-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_rgba(45,120,160,0.28)] transition-transform hover:scale-105 active:scale-95 lg:hidden"
    >
      <Plus className="size-6" strokeWidth={2.5} />
    </Link>
  );
}

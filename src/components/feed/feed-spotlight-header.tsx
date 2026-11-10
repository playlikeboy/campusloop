import { ArrowRight } from "lucide-react";
import Link from "next/link";

/** Title row shared by the discovery rows that sit between feed posts. */
export function FeedSpotlightHeader({ id, title, href }: { id: string; title: string; href: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 px-4">
      <h3 id={id} className="truncate text-base">
        {title}
      </h3>
      <Link
        href={href}
        aria-label={`See all: ${title}`}
        className="inline-flex min-h-11 shrink-0 items-center gap-1 px-1 text-sm font-semibold text-brand-text hover:underline underline-offset-4"
      >
        See all <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

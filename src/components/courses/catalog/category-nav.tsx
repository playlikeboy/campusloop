import Link from "next/link";
import { categorySlug } from "@/lib/courses/catalog-params";
import { cn } from "@/lib/utils";

/** Swipeable topic chips; each is a real /courses/category/<slug> link. */
export function CategoryNav({ categories, active }: { categories: { category: string }[]; active: string | null }) {
  return (
    <nav aria-label="Course topics" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <Link href="/courses" aria-current={!active ? "page" : undefined} className={chip(!active)}>All</Link>
      {categories.map((c) => (
        <Link key={c.category} href={`/courses/category/${categorySlug(c.category)}`} aria-current={active === c.category ? "page" : undefined} className={chip(active === c.category)}>
          {c.category}
        </Link>
      ))}
    </nav>
  );
}

const chip = (on: boolean) =>
  cn(
    "flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    on ? "bg-foreground text-background" : "bg-muted/60 text-muted-foreground hover:text-foreground"
  );

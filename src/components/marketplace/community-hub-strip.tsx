import { BookOpen, Car, ChevronRight, Gamepad2, Home, PackageSearch, ShoppingBag } from "lucide-react";
import Link from "next/link";

export type HubTabType =
  | "all"
  | "discussions"
  | "lost_found"
  | "marketplace"
  | "gaming"
  | "rideshare"
  | "housing"
  | "academics";

export const COMMUNITY_HUBS = [
  {
    id: "marketplace" as HubTabType,
    title: "Buy & sell",
    tagline: "Used cycles, books and room stuff",
    href: "/buy-and-sell",
    icon: ShoppingBag,
  },
  {
    id: "lost_found" as HubTabType,
    title: "Lost & found",
    tagline: "Lost keys, ID cards, earphones",
    href: "/lost-and-found",
    icon: PackageSearch,
  },
  {
    id: "rideshare" as HubTabType,
    title: "Rideshare",
    tagline: "Split a cab to the station or airport",
    href: "/rideshare",
    icon: Car,
  },
  {
    id: "housing" as HubTabType,
    title: "Housing",
    tagline: "PGs, rooms and flatmates",
    href: "/housing",
    icon: Home,
  },
  {
    id: "academics" as HubTabType,
    title: "Notes & PYQs",
    tagline: "Old papers and notes",
    href: "/academics",
    icon: BookOpen,
  },
  {
    id: "gaming" as HubTabType,
    title: "Gaming",
    tagline: "Find people to play with",
    href: "/gaming",
    icon: Gamepad2,
  },
];

/** Links to the student-run spaces. A plain list, not a card grid. */
export function CommunityHubStrip() {
  return (
    <section aria-labelledby="student-spaces-title" className="space-y-2">
      <div>
        <h2 id="student-spaces-title" className="font-sans text-base font-semibold text-fg">
          From other students
        </h2>
        <p className="text-sm text-fg-muted">Posted by students, not shops.</p>
      </div>
      <ul className="grid gap-x-4 sm:grid-cols-2">
        {COMMUNITY_HUBS.map((hub) => {
          const Icon = hub.icon;
          return (
            <li key={hub.id}>
              <Link
                href={hub.href}
                className="group flex min-h-14 items-center gap-3 rounded-md px-2 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="size-5 shrink-0 text-fg-muted" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-fg">{hub.title}</span>
                  <span className="block truncate text-sm text-fg-muted">{hub.tagline}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

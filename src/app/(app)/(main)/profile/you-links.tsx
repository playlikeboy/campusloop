import { Bell, Bookmark, ChevronRight, ClipboardList, Flame, Lock, Settings, Smartphone } from "lucide-react";
import Link from "next/link";

const YOU_LINKS = [
  { href: "/streaks", label: "Streaks", icon: Flame },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/crush", label: "Secret Crush", icon: Lock },
  { href: "/board", label: "Campus board", icon: ClipboardList },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

const tileClass =
  "flex min-h-12 items-center gap-2 rounded-lg bg-surface-muted px-2.5 text-sm font-semibold text-fg transition-ui outline-none hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]";

/** "You" hub on your own profile: the places that belong to you, one tap away. */
export function YouLinks() {
  return (
    <nav aria-label="Your places" className="px-4 pt-4 sm:px-6">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {YOU_LINKS.map(({ href, label, icon: Icon }) => (
          <li key={href} className="min-w-0">
            <Link href={href} prefetch className={tileClass}>
              <Icon className="size-4.5 shrink-0 text-brand-text" aria-hidden="true" />
              <span className="truncate">{label}</span>
            </Link>
          </li>
        ))}
        <li className="col-span-2 min-w-0 sm:col-span-3 lg:col-span-2">
          <Link href="/download" className={tileClass}>
            <Smartphone className="size-4.5 shrink-0 text-brand-text" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">Get the Android app (beta)</span>
            <ChevronRight className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
          </Link>
        </li>
      </ul>
    </nav>
  );
}

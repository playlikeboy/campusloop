import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";
import { InstagramIcon, LinkedinIcon } from "@/components/ui/social-icons";
import { SOCIAL_LINKS } from "@/constants/social";
import { cn } from "@/lib/utils";
import { MarketingMobileMenu } from "./marketing-mobile-menu";

export const MARKETING_NAV_LINKS = [
  { href: "/colleges", label: "Colleges" },
  { href: "/academics", label: "Study material" },
  { href: "/events", label: "Events" },
  { href: "/about", label: "About" },
];

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/guide", label: "Guide" },
  { href: "/help", label: "Help" },
  { href: "/contact", label: "Contact" },
  { href: "/safety", label: "Safety" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

const FOOTER_MORE_LINKS = [
  { href: "/communities", label: "Communities" },
  { href: "/courses", label: "Courses" },
  { href: "/articles", label: "Articles" },
  { href: "/matching", label: "Campus Match" },
  { href: "/aspirants", label: "For aspirants" },
  { href: "/products", label: "Products" },
  { href: "/join", label: "Work with us" },
  { href: "/sitemap", label: "Sitemap" },
];

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const SOCIAL_ICONS = {
  instagram: InstagramIcon,
  linkedin: LinkedinIcon,
  x: XIcon,
} as const;

const linkFocus = "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export interface MarketingNavProps {
  /** Signed-in visitors get "Open app" instead of Sign in / Join. */
  isAuthenticated?: boolean;
}

/** Marketing header: logo, four links, one Join button. Solid surface, no blur. */
export function MarketingNav({ isAuthenticated = false }: MarketingNavProps = {}) {
  return (
    <header className="sticky top-0 z-[var(--z-sticky-nav)] border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-[var(--container-marketing)] items-center justify-between gap-4 px-[var(--gutter)]">
        <BrandLogo href="/" size="md" />

        <nav aria-label="Site" className="hidden items-center gap-1 md:flex">
          {MARKETING_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-fg-muted transition-ui hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link
              href="/feeds"
              className="hidden h-11 items-center rounded-full bg-brand px-5 text-sm font-semibold text-brand-fg transition-ui hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] sm:inline-flex"
            >
              Open app
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden h-11 items-center rounded-full px-4 text-sm font-medium text-fg-muted transition-ui hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="hidden h-11 items-center rounded-full bg-brand px-5 text-sm font-semibold text-brand-fg transition-ui hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] sm:inline-flex"
              >
                Join
              </Link>
            </>
          )}
          <MarketingMobileMenu links={MARKETING_NAV_LINKS} isAuthenticated={isAuthenticated} />
        </div>
      </div>
    </header>
  );
}

/** Small footer: one line about CampusLoop, socials, two rows of links. */
export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-[var(--container-marketing)] px-[var(--gutter)] py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <BrandLogo href="/" size="md" />
            <p className="mt-3 text-sm text-fg-muted">
              The app for students at Indian colleges. Join with your college email.
            </p>
          </div>
          <ul className="flex items-center gap-1">
            {(Object.keys(SOCIAL_LINKS) as Array<keyof typeof SOCIAL_LINKS>).map((key) => {
              const social = SOCIAL_LINKS[key];
              const Icon = SOCIAL_ICONS[key];
              return (
                <li key={key}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${social.label}: ${social.handle}`}
                    className="flex size-11 items-center justify-center rounded-full text-fg-muted transition-ui hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Icon className="size-5" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <nav aria-label="Footer" className="mt-8 space-y-3 text-sm">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={cn(linkFocus, "font-medium text-fg hover:text-brand-text")}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {FOOTER_MORE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={cn(linkFocus, "text-fg-muted hover:text-fg")}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-8 text-sm text-fg-subtle">&copy; {new Date().getFullYear()} CampusLoop</p>
      </div>
    </footer>
  );
}

export interface MarketingShellProps {
  children: React.ReactNode;
  className?: string;
  isAuthenticated?: boolean;
}

/** Public pages: simple header, main, small footer. */
export function MarketingShell({ children, className, isAuthenticated }: MarketingShellProps) {
  return (
    <div className={cn("flex min-h-dvh flex-col bg-bg text-fg", className)}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[var(--z-toast)] focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-fg"
      >
        Skip to main content
      </a>
      <MarketingNav isAuthenticated={isAuthenticated} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}

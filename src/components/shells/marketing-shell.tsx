import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";
import { InstagramIcon, LinkedinIcon } from "@/components/ui/social-icons";
import { SOCIAL_LINKS } from "@/constants/social";
import { cn } from "@/lib/utils";
import { MarketingMobileMenu } from "./marketing-mobile-menu";

const NAV_LINKS = [
  { href: "/colleges", label: "Colleges" },
  { href: "/academics", label: "Academics" },
  { href: "/communities", label: "Communities" },
  { href: "/guide", label: "Guide" },
  { href: "/about", label: "About" },
];

const FOOTER_COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/colleges", label: "Colleges" },
      { href: "/academics", label: "Academics" },
      { href: "/communities", label: "Communities" },
      { href: "/events", label: "Events" },
      { href: "/courses", label: "Courses" },
      { href: "/matching", label: "Campus Match" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/guide", label: "Guide" },
      { href: "/articles", label: "Articles" },
      { href: "/aspirants", label: "For aspirants" },
      { href: "/help", label: "Help centre" },
      { href: "/sitemap", label: "Sitemap" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/products", label: "Products" },
      { href: "/pitch", label: "Pitch" },
      { href: "/investors", label: "Investors" },
      { href: "/join", label: "Join the team" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/safety", label: "Safety" },
    ],
  },
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

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-[var(--z-sticky-nav)] border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[var(--container-marketing)] items-center justify-between gap-4 px-[var(--gutter)]">
        <BrandLogo href="/" size="md" />

        <nav aria-label="Site" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="hidden h-10 items-center rounded-md px-3 text-sm font-medium text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="hidden h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-brand-fg hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] sm:inline-flex"
          >
            Join with college email
          </Link>
          <MarketingMobileMenu links={NAV_LINKS} />
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-[var(--container-marketing)] px-[var(--gutter)] py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:gap-8">
          <div className="max-w-xs">
            <BrandLogo href="/" size="md" />
            <p className="mt-4 text-sm leading-6 text-fg-muted">
              The verified social network for Indian college students. One campus email, every campus conversation.
            </p>
            <ul className="mt-6 flex items-center gap-2">
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
                      className="flex size-10 items-center justify-center rounded-md text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Icon className="size-5" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-semibold text-fg">{column.title}</h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-fg-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-sm text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} CampusLoop</p>
          <ul className="flex items-center gap-4">
            <li>
              <Link href="/privacy" className="hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/safety" className="hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Safety
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export function MarketingShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-dvh flex-col bg-bg text-fg", className)}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[var(--z-toast)] focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-fg"
      >
        Skip to main content
      </a>
      <MarketingNav />
      <main id="main" className="flex-1">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}

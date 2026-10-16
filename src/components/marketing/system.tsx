import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { InstagramIcon, LinkedinIcon, XIcon } from "@/components/ui/social-icons";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SOCIAL_LINKS } from "@/constants/socials";
import { cn } from "@/lib/utils";

export const BRAND_GRADIENT = "bg-primary";

export function GradientText({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("text-primary font-bold", className)}>{children}</span>;
}

export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  return <BrandLogo size={size} href="/" />;
}

export {
  LandingBadge,
  type LandingBadgeProps,
  LandingCard,
  type LandingCardProps,
  LandingContainer,
  type LandingContainerProps,
  LandingSection,
  LandingSectionHeader,
  type LandingSectionHeaderProps,
  type LandingSectionProps,
} from "@/components/landing/landing-design-system";

import Image from "next/image";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/academics", label: "Academics" },
  { href: "/communities", label: "Communities" },
  { href: "/events", label: "Events" },
  { href: "/colleges", label: "Colleges" },
];

export function MarketingHeader({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="relative size-8 sm:size-9 shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3 drop-shadow-sm">
            <Image
              src="/campusloop/marketing/voxel/logo.webp"
              alt="CampusLoop Voxel Logo"
              width={36}
              height={36}
              className="object-contain"
            />
          </div>
          <span className="font-heading font-black tracking-tight text-foreground text-base sm:text-lg">
            Campus<span className="text-primary">Loop</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 bg-muted/40 p-1 rounded-full border border-border/40 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-background/90 transition-all"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="size-8.5 rounded-full border-none bg-muted/50 hover:bg-muted" />
          {isAuthenticated ? (
            <Link
              href="/feeds"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#22c55e] hover:bg-[#16a34a] px-4 text-xs font-bold text-white shadow-xs transition-all"
            >
              Open app
              <ArrowRight className="size-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden sm:inline-flex h-9 items-center px-3.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex h-9 items-center gap-1 rounded-full bg-[#22c55e] hover:bg-[#16a34a] px-4 text-xs font-black text-white shadow-xs transition-all"
              >
                Join CampusLoop
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const FOOTER_COLUMNS: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/academics", label: "Academics" },
      { href: "/communities", label: "Communities" },
      { href: "/events", label: "Events" },
      { href: "/colleges", label: "Colleges" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/safety", label: "Safety" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/guide", label: "Product Guide" },
      { href: "/investors", label: "For Investors" },
      { href: "/docs", label: "Engineering Docs" },
      { href: "/help", label: "Help & FAQs" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/sitemap", label: "Visual Sitemap" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-3.5">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="relative size-8 shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 drop-shadow-sm">
              <Image
                src="/campusloop/marketing/voxel/logo.webp"
                alt="CampusLoop Voxel Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <span className="font-heading font-black tracking-tight text-foreground text-base">
              Campus<span className="text-primary">Loop</span>
            </span>
          </Link>
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
            The verified student-only social network for Indian colleges. Built for students, gated by a college email.
          </p>

          {/* ─── Prioritized Social Links (Instagram -> LinkedIn -> X) ─── */}
          <div className="flex items-center gap-2 pt-2">
            <a
              href={SOCIAL_LINKS.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground transition-colors hover:border-pink-500/50 hover:bg-pink-500/10 hover:text-pink-500 shadow-2xs"
              aria-label="CampusLoop on Instagram"
              title="Instagram @campusloop.space"
            >
              <InstagramIcon className="size-4" />
            </a>

            <a
              href={SOCIAL_LINKS.linkedin.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground transition-colors hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-500 shadow-2xs"
              aria-label="CampusLoop on LinkedIn"
              title="LinkedIn @mycampusloop"
            >
              <LinkedinIcon className="size-4" />
            </a>

            <a
              href={SOCIAL_LINKS.x.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/10 hover:text-foreground shadow-2xs"
              aria-label="CampusLoop on X"
              title="X (Twitter) @mycampusloop"
            >
              <XIcon className="size-3.5" />
              <span className="sr-only">X (Twitter)</span>
            </a>
          </div>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <nav key={col.title} className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((link) =>
                link.external ? (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ) : (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col sm:flex-row items-center justify-between gap-3 px-6 py-5 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} CampusLoop. Your campus, unfiltered.</p>
          <div className="flex items-center gap-4 text-xs">
            <a
              href={SOCIAL_LINKS.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Instagram
            </a>
            <span>·</span>
            <a
              href={SOCIAL_LINKS.linkedin.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              LinkedIn
            </a>
            <span>·</span>
            <a
              href={SOCIAL_LINKS.x.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              X
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Section({
  id,
  tone = "default",
  className,
  children,
}: {
  id?: string;
  tone?: "default" | "muted" | "bordered";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-20",
        tone === "muted" && "border-y border-border/60 bg-muted/30",
        tone === "bordered" && "border-t border-border/60"
      )}
    >
      <div className={cn("mx-auto w-full max-w-6xl px-6 py-20 md:py-24", className)}>{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl space-y-3 pb-12", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>}
      <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      {lede && <p className="text-base leading-relaxed text-muted-foreground">{lede}</p>}
    </div>
  );
}

export function StatCard({ value, label, sub }: { value: React.ReactNode; label: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs">
      <p className="text-3xl font-black tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-sm font-bold text-foreground">{label}</p>
      {sub && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function CTABand({
  title,
  lede,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: React.ReactNode;
  lede?: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <Section tone="bordered" className="py-24 text-center md:py-28">
      <div className="space-y-6">
        <h2 className="text-4xl font-bold tracking-tight md:text-5xl">{title}</h2>
        {lede && <p className="mx-auto max-w-md text-base text-muted-foreground md:text-lg">{lede}</p>}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href={primaryHref} className={cn(buttonVariants({ size: "lg" }), "gap-1.5")}>
            {primaryLabel}
            <ArrowRight className="size-4" />
          </Link>
          {secondaryHref && secondaryLabel && (
            <Link href={secondaryHref} className={buttonVariants({ variant: "ghost", size: "lg" })}>
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </Section>
  );
}

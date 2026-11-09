import { ArrowUpRight, BookOpen, Bot, Calendar, Compass, FileText, HelpCircle, Info, LineChart, Mail, MapPin, Shield, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/shells/marketing-shell";

export const metadata: Metadata = {
  title: "Sitemap · CampusLoop",
  description: "Every public CampusLoop page: explore, academics, communities, events, colleges, company and legal pages.",
  keywords: ["CampusLoop Sitemap", "College Directory", "Campus Network Directory"],
  alternates: { canonical: "https://campusloop.space/sitemap" },
  openGraph: {
    title: "Sitemap · CampusLoop",
    description: "Every public CampusLoop page.",
    url: "https://campusloop.space/sitemap",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://campusloop.space/og-image.png", width: 1200, height: 630, alt: "CampusLoop sitemap" }],
  },
  twitter: { card: "summary_large_image", title: "Sitemap · CampusLoop", description: "Every public CampusLoop page.", images: ["https://campusloop.space/og-image.png"] },
};

interface SitemapNode {
  title: string;
  href: string;
  description: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
}

const PRIMARY_BRANCHES: SitemapNode[] = [
  {
    title: "Explore",
    href: "/explore",
    description: "Trending campus activity across India",
    icon: Compass,
    children: [
      { label: "Feed", href: "/feeds" },
      { label: "College hubs", href: "/colleges" },
    ],
  },
  {
    title: "Academics",
    href: "/academics",
    description: "Student-uploaded notes, past papers and study guides",
    icon: BookOpen,
    children: [
      { label: "Notes", href: "/academics" },
      { label: "Search", href: "/academics/study-material/search" },
      { label: "Upload material", href: "/academics/study-material/upload" },
    ],
  },
  {
    title: "Communities",
    href: "/communities",
    description: "Clubs, chapters and student interest groups",
    icon: Users,
    children: [{ label: "Create a community", href: "/communities/new" }],
  },
  {
    title: "Events",
    href: "/events",
    description: "Hackathons, fests, workshops and meetups",
    icon: Calendar,
    children: [{ label: "Create an event", href: "/events/new" }],
  },
  {
    title: "Colleges",
    href: "/colleges",
    description: "Colleges in our directory",
    icon: MapPin,
    children: [{ label: "Request a hub", href: "/college-request" }],
  },
];

const COMPANY_ROUTES = [
  { label: "About", href: "/about", description: "Who builds CampusLoop and why", icon: Info },
  { label: "Safety", href: "/safety", description: "Anti-ragging policy and reporting", icon: Shield },
  { label: "Contact", href: "/contact", description: "Support desks and grievance officer", icon: Mail },
];

const RESOURCE_ROUTES = [
  { label: "Product guide", href: "/guide", description: "Every feature, how to use it and why", icon: BookOpen },
  { label: "For investors", href: "/investors", description: "Problem, product, moats, revenue and growth", icon: LineChart },
  { label: "AI-readable overview", href: "/llms-full.txt", description: "The whole app as plain text", icon: Bot },
  { label: "Help", href: "/help", description: "Answers to everyday questions", icon: HelpCircle },
  { label: "Privacy policy", href: "/privacy", description: "What we collect and your rights", icon: FileText },
  { label: "Terms of service", href: "/terms", description: "Who can join and what you may post", icon: FileText },
];

function RouteList({ title, routes }: { title: string; routes: typeof COMPANY_ROUTES }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="mb-4 text-base font-semibold text-fg">{title}</h2>
      <div className="space-y-3">
        {routes.map((route) => {
          const Icon = route.icon;
          return (
            <Link
              key={route.href}
              href={route.href}
              className="group flex items-center justify-between rounded-md border border-border p-3.5 transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-brand-subtle text-brand-text">
                  <Icon className="size-4" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-fg">{route.label}</p>
                  <p className="text-xs text-fg-muted">{route.description}</p>
                </div>
              </div>
              <ArrowUpRight className="size-4 text-fg-subtle" aria-hidden />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function SitemapPage() {
  return (
    <MarketingShell>
      <main className="py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-fg">Sitemap</h1>
            <p className="mt-3 text-base text-fg-muted">Every public page and core section of CampusLoop.</p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {PRIMARY_BRANCHES.map((node) => {
              const Icon = node.icon;
              return (
                <div key={node.title} className="flex flex-col justify-between rounded-lg border border-border bg-surface p-4">
                  <div>
                    <div className="flex size-8 items-center justify-center rounded-md bg-brand-subtle text-brand-text">
                      <Icon className="size-4" aria-hidden />
                    </div>
                    <Link href={node.href} className="group mt-3 flex items-center gap-1 text-base font-semibold text-fg hover:text-brand-text">
                      <span>{node.title}</span>
                      <ArrowUpRight className="size-3.5 text-fg-subtle" aria-hidden />
                    </Link>
                    <p className="mt-1 text-xs leading-snug text-fg-muted">{node.description}</p>
                  </div>
                  {node.children && (
                    <ul className="mt-4 space-y-1.5 border-t border-border pt-3">
                      {node.children.map((child) => (
                        <li key={child.href + child.label}>
                          <Link href={child.href} className="text-sm text-fg-muted transition-colors hover:text-fg">
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            <RouteList title="Company and safety" routes={COMPANY_ROUTES} />
            <RouteList title="Resources and legal" routes={RESOURCE_ROUTES} />
          </div>
        </div>
      </main>
    </MarketingShell>
  );
}

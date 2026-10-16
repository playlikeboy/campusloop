"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Bot, Calendar, Compass, FileText, HelpCircle, Info, LineChart, Mail, MapPin, Network, Shield, Users } from "lucide-react";
import { CleanFooter } from "@/components/landing/clean-footer";
import { MinimalLandingNavbar } from "@/components/landing/minimal-landing-navbar";

interface SitemapNode {
  title: string;
  href: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
  children?: { label: string; href: string }[];
}

const PRIMARY_BRANCHES: SitemapNode[] = [
  {
    title: "Explore",
    href: "/explore",
    description: "National campus radar and trending college activities",
    icon: Compass,
    badge: "Discovery",
    children: [
      { label: "Trending Feed", href: "/feeds" },
      { label: "College Hubs", href: "/colleges" },
    ],
  },
  {
    title: "Academics",
    href: "/academics",
    description: "Peer-reviewed lecture notes, PYQs, and semester study guides",
    icon: BookOpen,
    badge: "Vault",
    children: [
      { label: "Lecture Notes", href: "/academics" },
      { label: "5-Year PYQs", href: "/academics" },
      { label: "Upload Material", href: "/academics/upload" },
    ],
  },
  {
    title: "Communities",
    href: "/communities",
    description: "University clubs, chapters, and student interest circles",
    icon: Users,
    badge: "Clubs",
    children: [
      { label: "Student Clubs", href: "/communities" },
      { label: "Campus Chapters", href: "/communities" },
    ],
  },
  {
    title: "Events",
    href: "/events",
    description: "Hackathons, campus fests, workshops, and student meetups",
    icon: Calendar,
    badge: "Calendar",
    children: [
      { label: "Hackathons", href: "/events" },
      { label: "College Fests", href: "/events" },
      { label: "Workshops", href: "/events" },
    ],
  },
  {
    title: "Colleges",
    href: "/colleges",
    description: "Indexed directory of 1,350+ Indian university hubs",
    icon: MapPin,
    badge: "Directory",
    children: [
      { label: "IITs & NITs", href: "/colleges" },
      { label: "Request Hub", href: "/college-request" },
    ],
  },
];

const COMPANY_ROUTES = [
  { label: "About Us", href: "/about", description: "Our campus-first mission and origin", icon: Info },
  { label: "Safety & Standards", href: "/safety", description: "Anti-ragging and verification protocols", icon: Shield },
  { label: "Contact Desks", href: "/contact", description: "Student support and domain onboarding", icon: Mail },
];

const RESOURCE_ROUTES = [
  { label: "Product Guide", href: "/guide", description: "Every feature: how to use it, why, and use cases", icon: BookOpen },
  { label: "For Investors", href: "/investors", description: "Problem, product, moats, revenue and growth", icon: LineChart },
  { label: "AI-readable overview", href: "/llms-full.txt", description: "The whole app as plain text for AI models", icon: Bot },
  { label: "Help & FAQs", href: "/help", description: "Answers to everyday student questions", icon: HelpCircle },
  { label: "Privacy Policy", href: "/privacy", description: "Data minimization and DPDP Act compliance", icon: FileText },
  { label: "Terms of Service", href: "/terms", description: "Student community acceptable use rules", icon: FileText },
];

export function SitemapClient() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <MinimalLandingNavbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Network className="size-3.5" />
              <span>CampusLoop Architecture</span>
            </span>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Visual Sitemap
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A clear, accessible visual map of every verified public page and core campus layer.
            </p>
          </div>

          {/* Root Node: CampusLoop */}
          <div className="mt-12 flex flex-col items-center">
            <div className="relative inline-flex items-center gap-3 rounded-2xl border-2 border-primary/40 bg-card px-6 py-3.5 shadow-md shadow-primary/10">
              <div className="size-8 rounded-xl bg-gradient-to-tr from-primary via-purple-600 to-indigo-500 flex items-center justify-center text-white text-xs font-black">
                CL
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-foreground">CampusLoop</p>
                <p className="text-[10px] text-muted-foreground">Root Domain • campusloop.space</p>
              </div>
            </div>

            {/* Tree Stem */}
            <div className="h-8 w-px bg-border my-1" />
            <div className="hidden sm:block h-px w-3/4 max-w-3xl bg-border" />
          </div>

          {/* Primary Platform Branches Grid */}
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {PRIMARY_BRANCHES.map((node) => {
              const Icon = node.icon;
              return (
                <div
                  key={node.title}
                  className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-4 shadow-2xs hover:border-primary/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-3.5" />
                      </div>
                      {node.badge && (
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                          {node.badge}
                        </span>
                      )}
                    </div>

                    <Link
                      href={node.href}
                      className="mt-3 flex items-center gap-1 text-sm font-bold text-foreground hover:text-primary transition-colors group"
                    >
                      <span>{node.title}</span>
                      <ArrowUpRight className="size-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </Link>

                    <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
                      {node.description}
                    </p>
                  </div>

                  {node.children && (
                    <ul className="mt-4 pt-3 border-t border-border/40 space-y-1.5">
                      {node.children.map((child) => (
                        <li key={child.label}>
                          <Link
                            href={child.href}
                            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                          >
                            <span className="text-primary/60">↳</span>
                            <span>{child.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {/* Secondary Groups: Company & Resources */}
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {/* Company Column */}
            <div className="rounded-3xl border border-border/60 bg-muted/20 p-5 sm:p-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">
                Company &amp; Safety
              </h2>
              <div className="space-y-3">
                {COMPANY_ROUTES.map((route) => {
                  const Icon = route.icon;
                  return (
                    <Link
                      key={route.href}
                      href={route.href}
                      className="group flex items-center justify-between rounded-xl border border-border/50 bg-card p-3.5 shadow-2xs hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="size-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                            {route.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{route.description}</p>
                        </div>
                      </div>
                      <ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Resources Column */}
            <div className="rounded-3xl border border-border/60 bg-muted/20 p-5 sm:p-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">
                Resources &amp; Legal
              </h2>
              <div className="space-y-3">
                {RESOURCE_ROUTES.map((route) => {
                  const Icon = route.icon;
                  return (
                    <Link
                      key={route.href}
                      href={route.href}
                      className="group flex items-center justify-between rounded-xl border border-border/50 bg-card p-3.5 shadow-2xs hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="size-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                            {route.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{route.description}</p>
                        </div>
                      </div>
                      <ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Voxel Campus Map Preview Strip */}
          <div className="mt-14 overflow-hidden rounded-3xl border border-border/60 bg-card p-4 sm:p-6 shadow-xs flex flex-col md:flex-row items-center gap-6">
            <div className="relative aspect-16/9 w-full max-w-xs overflow-hidden rounded-2xl bg-muted/30 shrink-0">
              <Image
                src="/campusloop/marketing/voxel/campus-map.webp"
                alt="3D voxel map of connected universities across India"
                fill
                sizes="(max-width: 768px) 100vw, 320px"
                className="object-cover"
                loading="lazy"
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Network Topology
              </p>
              <h3 className="mt-1 text-base font-bold text-foreground">
                Connecting 1,350+ College Hubs Across India
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                CampusLoop is architected as federated college campuses. Each university operates its own private vault and feed, connected via a national student exploration radar.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Link
                  href="/colleges"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline underline-offset-4"
                >
                  <span>Explore College Directory</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <CleanFooter />
    </div>
  );
}

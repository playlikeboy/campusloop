"use client";

import {
  ArrowRight,
  Building2,
  Calendar,
  Check,
  Copy,
  ExternalLink,
  GraduationCap,
  Heart,
  Home,
  Lock,
  Mail,
  ShoppingBag,
  Users,
  VenetianMask,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CompanyNav } from "@/components/marketing/company-nav";
import {
  DocLayout,
  DocList,
  DocNote,
  DocSection,
  type DocSectionRef,
  DocTable,
  LegalDocHeader,
} from "@/components/marketing/legal-doc";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/system";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SECTIONS: DocSectionRef[] = [
  { id: "credentials", label: "Evaluation credentials" },
  { id: "quickstart", label: "3-step evaluation" },
  { id: "surfaces", label: "Direct exploration & hubs" },
  { id: "matrix", label: "Feature checklist" },
  { id: "sandboxes", label: "Campus sandboxes" },
  { id: "faq", label: "Evaluator FAQ" },
];

const CORE_SURFACES = [
  {
    href: "/feeds",
    label: "Campus Feeds",
    desc: "Dynamic student feed with Confessions, Polls, Questions, Hashtags & Twitter-style Reposts",
    icon: Home,
    badge: "Core Feed",
    badgeColor: "bg-primary/10 text-primary border-primary/20",
  },
  {
    href: "/academics",
    label: "Academic Vault",
    desc: "100,000+ indexed study notes, PYQ question papers, branch & semester filters",
    icon: GraduationCap,
    badge: "Vault",
    badgeColor: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  },
  {
    href: "/colleges",
    label: "Colleges Directory",
    desc: "1,350+ indexed Indian college hubs with instant search & hub request forms",
    icon: Building2,
    badge: "1,350+ Hubs",
    badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  {
    href: "/dating",
    label: "Campus Match",
    desc: "Swipe deck for connecting with verified fellow students filtered by radius & gender",
    icon: Heart,
    badge: "Swipe Deck",
    badgeColor: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  },
  {
    href: "/communities",
    label: "Communities & Clubs",
    desc: "Student-created societies, technical clubs, gaming squads & batch boards",
    icon: Users,
    badge: "Clubs & Squads",
    badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
  {
    href: "/confessions",
    label: "Campus Confessions",
    desc: "Anonymous student thoughts & scoops protected with cryptographic identity escrow",
    icon: VenetianMask,
    badge: "Identity Escrow",
    badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  {
    href: "/events",
    label: "Events & Fests",
    desc: "Hackathons, college cultural fests, tech symposiums, and registrations",
    icon: Calendar,
    badge: "Events",
    badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  {
    href: "/marketplace",
    label: "Campus Marketplace",
    desc: "Student buy/sell dorm essentials, books, cycles, and local canteen orders",
    icon: ShoppingBag,
    badge: "BETA",
    badgeColor: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
];

export function DemoClient() {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const demoEmail = "demo@campusloop.space";
  const demoPass = "CampusLoop@2026!";

  const copyToClipboard = async (text: string, type: "email" | "pass" | "all") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "email") {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
        toast.success("Demo email copied to clipboard");
      } else if (type === "pass") {
        setCopiedPass(true);
        setTimeout(() => setCopiedPass(false), 2000);
        toast.success("Demo password copied to clipboard");
      } else {
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
        toast.success("All demo credentials copied to clipboard");
      }
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <MarketingHeader />
      <CompanyNav />

      <main className="flex-1 pt-14">
        <DocLayout sections={SECTIONS}>
          <LegalDocHeader
            eyebrow="Evaluation & Testing"
            title="Demo & Evaluation Environment"
            summary="Instant testing credentials and access parameters for evaluators, investors, and university administrators to test CampusLoop with all verified student capabilities unlocked."
            meta={["Sandbox v2.4", "100% Feature Access", "BIT Mesra Test Graph", "Cloudflare Edge"]}
          />

          {/* 01. Evaluation Credentials */}
          <DocSection id="credentials" number={1} title="Evaluation credentials">
            <p>
              CampusLoop is ordinarily restricted to active students with a recognized{" "}
              <code className="font-mono text-xs">.ac.in</code> college email. To enable comprehensive
              evaluation without an active Indian university roll number, we maintain an all-access tester
              account provisioned with full student verification privileges:
            </p>

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              {/* Email Card */}
              <div className="rounded-2xl border border-border/60 bg-card/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Mail className="size-3.5" />
                    <span>Demo Account Email</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(demoEmail, "email")}
                    className="flex size-7 items-center justify-center rounded-lg border border-border/40 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Copy demo email"
                    aria-label="Copy demo email"
                  >
                    {copiedEmail ? (
                      <Check className="size-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>
                <code className="block font-mono text-sm font-bold text-foreground select-all">
                  {demoEmail}
                </code>
              </div>

              {/* Password Card */}
              <div className="rounded-2xl border border-border/60 bg-card/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Lock className="size-3.5" />
                    <span>Demo Account Password</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(demoPass, "pass")}
                    className="flex size-7 items-center justify-center rounded-lg border border-border/40 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Copy demo password"
                    aria-label="Copy demo password"
                  >
                    {copiedPass ? (
                      <Check className="size-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>
                <code className="block font-mono text-sm font-bold text-foreground select-all">
                  {demoPass}
                </code>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-3">
              <Link
                href="/sign-in?returnTo=/feeds"
                className={cn(buttonVariants({ size: "default" }), "gap-2 cursor-pointer shadow-xs")}
              >
                <span>Sign In to Evaluation Sandbox</span>
                <ExternalLink className="size-3.5" />
              </Link>

              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    `Email: ${demoEmail}\nPassword: ${demoPass}`,
                    "all"
                  )
                }
                className={cn(
                  buttonVariants({ variant: "outline", size: "default" }),
                  "gap-2 cursor-pointer"
                )}
              >
                {copiedAll ? (
                  <Check className="size-3.5 text-emerald-400" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                <span>Copy Credentials</span>
              </button>

              <Link
                href="/feeds"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "default" }),
                  "gap-1.5 cursor-pointer"
                )}
              >
                <span>Explore Feeds Directly</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <DocNote>
              The evaluation account is reset nightly. Test posts, confession drafts, and match connections
              generated during testing will remain visible within the sandbox session until the next 04:00 IST
              maintenance cycle.
            </DocNote>
          </DocSection>

          {/* 02. 3-Step Evaluation Walkthrough */}
          <DocSection id="quickstart" number={2} title="3-step evaluation walkthrough">
            <p>
              To experience the core architectural loops of CampusLoop, we recommend walking through this
              3-step sequence:
            </p>

            <DocList
              items={[
                "Step 1: Sign in with the demo account and inspect the verified student badge. Notice that your handle, college affiliation (BIT Mesra), and loop score are initialized.",
                "Step 2: Toggle Campus Radius on the feed header. Switch between 'Local Campus' (showing only BIT Mesra posts) and 'Global Network' (aggregated feeds across Indian colleges).",
                "Step 3: Test Anonymity Mode. Click the avatar drawer or sidebar switcher and toggle between 'All Posts & Anon' and 'Public Only'. Notice the instant zero-reload timeline filter and cryptographic handle assignment.",
              ]}
            />
          </DocSection>

          {/* 03. Direct Exploration & Key Surfaces */}
          <DocSection id="surfaces" number={3} title="Direct exploration & key surfaces">
            <p>
              Jump directly into any core campus surface below. All hubs are active and connected
              to the multi-campus graph:
            </p>

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              {CORE_SURFACES.map((surface) => {
                const Icon = surface.icon;
                return (
                  <div
                    key={surface.href}
                    className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-card/60 p-4 transition-all hover:border-primary/40 hover:shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="size-4" />
                          </div>
                          <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                            {surface.label}
                          </h4>
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border",
                            surface.badgeColor
                          )}
                        >
                          {surface.badge}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {surface.desc}
                      </p>
                    </div>

                    <div className="pt-3 mt-2 border-t border-border/40 flex items-center justify-between">
                      <span className="font-mono text-[11px] text-muted-foreground/80">
                        {surface.href}
                      </span>
                      <Link
                        href={surface.href}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        <span>Open Surface</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </DocSection>

          {/* 04. Feature Verification Checklist */}
          <DocSection id="matrix" number={4} title="Feature verification checklist">
            <p>All key features are provisioned and active for evaluation:</p>

            <DocTable
              rows={[
                {
                  label: "Campus Feed & Confessions",
                  value: "Live Interactive Timeline",
                  note: "Create confessions, vote in live polls, ask campus questions, and quote/repost timeline updates.",
                },
                {
                  label: "Academic Vault & PYQs",
                  value: "100,000+ Exam Papers & Notes",
                  note: "Full-text search by subject code (e.g. CS201), in-browser PDF reader, and 1-click ChatGPT/Claude study prompt generators.",
                },
                {
                  label: "Campus Match / Dating",
                  value: "Verified Swipe Deck",
                  note: "Swipe deck filtered by gender and campus radius. Mutual opt-in requirement ensures zero uninvited messages.",
                },
                {
                  label: "Sub-Hubs & Communities",
                  value: "Interest Groups & Clubs",
                  note: "Explore campus clubs, coding societies, hostel boards, and departmental forums.",
                },
                {
                  label: "Peer-to-Peer Calling & Chat",
                  value: "WebRTC Audio & Video",
                  note: "Real-time direct browser calling via PeerJS with zero media routed through application servers.",
                },
              ]}
            />
          </DocSection>

          {/* 05. Institutional Test Sandboxes */}
          <DocSection id="sandboxes" number={5} title="Institutional test sandboxes">
            <p>
              The evaluation environment is seeded with real structural data simulating different campus
              tiers:
            </p>

            <DocTable
              rows={[
                {
                  label: "Birla Institute of Technology, Mesra",
                  value: "Primary Active Pilot Hub",
                  note: "Fully populated with 7,800+ PYQs, active confession timelines, hostel sub-hubs, and student marketplace items.",
                },
                {
                  label: "Indian Institute of Technology, Delhi",
                  value: "Metro Campus Simulation",
                  note: "Cross-campus discovery node testing inter-college interactions and nationwide academic syllabus packs.",
                },
                {
                  label: "Birla Institute of Technology & Science, Pilani",
                  value: "Multi-Campus Graph",
                  note: "Multi-campus testing with Pilani, Goa, and Hyderabad branches.",
                },
              ]}
            />
          </DocSection>

          {/* 06. Evaluator FAQ */}
          <DocSection id="faq" number={6} title="Evaluator FAQ">
            <p>Common questions regarding evaluation, institutional partnerships, and sandbox parameters:</p>

            <DocTable
              rows={[
                {
                  label: "Can our university test with our own domain?",
                  value: "Yes, via Institutional Sandbox Request",
                  note: "We can whitelist your university domain (.ac.in / .edu.in) within 24 hours for official pilot trials.",
                },
                {
                  label: "How are abusive posts handled during testing?",
                  value: "Automated Regex & PII Redaction",
                  note: "Submissions containing phone numbers or blacklisted keywords are automatically rejected by the serverless gateway.",
                },
                {
                  label: "Where should technical bugs be reported?",
                  value: "support@campusloop.space",
                  note: "Our engineering team monitors evaluator tickets with priority SLA under 4 hours.",
                },
              ]}
            />
          </DocSection>
        </DocLayout>
      </main>

      <MarketingFooter />
    </div>
  );
}

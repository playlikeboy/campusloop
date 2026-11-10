import type { Metadata } from "next";
import {
  DocLayout,
  DocList,
  DocNote,
  DocSection,
  type DocSectionRef,
  DocTable,
  LegalDocHeader,
} from "@/components/marketing/legal-doc";
import { MarketingShell } from "@/components/shells/marketing-shell";

const ANONYMITY_STATEMENT =
  "Anonymous posts never show your name or profile to anyone on CampusLoop, including classmates, seniors, faculty and college staff. Your identity is encrypted separately and can only be recovered by CampusLoop in response to a lawful order or a serious safety report, and every such access is logged.";

export const metadata: Metadata = {
  title: "Privacy Policy · CampusLoop",
  description:
    "What CampusLoop collects, how anonymous posting works, what we never do with your data, and your rights under India's DPDP Act, 2023.",
  keywords: ["Privacy Policy", "CampusLoop Privacy", "DPDP Act 2023", "Data Principal Rights", "Student Data Protection"],
  alternates: { canonical: "https://campusloop.space/privacy" },
  openGraph: {
    title: "Privacy Policy · CampusLoop",
    description: "What we collect, how anonymity works, and your rights under the DPDP Act, 2023.",
    url: "https://campusloop.space/privacy",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://campusloop.space/og-image.png", width: 1200, height: 630, alt: "Privacy Policy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy · CampusLoop",
    description: "What we collect, how anonymity works, and your rights under the DPDP Act, 2023.",
    images: ["https://campusloop.space/og-image.png"],
  },
  robots: { index: true, follow: true },
};

const SECTIONS: DocSectionRef[] = [
  { id: "collect", label: "What we collect" },
  { id: "anonymity", label: "How anonymity works" },
  { id: "analytics", label: "Analytics and tracking" },
  { id: "sharing", label: "What we never do" },
  { id: "rights", label: "Your rights" },
  { id: "security", label: "Storage and encryption" },
  { id: "officer", label: "Grievance officer" },
];

export default function PrivacyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "CampusLoop Privacy Policy",
    url: "https://campusloop.space/privacy",
    description: "How CampusLoop collects, uses and protects student data under India's DPDP Act, 2023.",
    publisher: {
      "@type": "Organization",
      name: "CampusLoop",
      legalName: "CampusLoop (not yet incorporated)",
      url: "https://campusloop.space",
      logo: "https://campusloop.space/logo.png",
      founder: { "@type": "Person", name: "Shaswat Raj" },
    },
    inLanguage: "en-IN",
    datePublished: "2026-01-01",
    dateModified: "2026-11-02",
  };

  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="py-12 sm:py-16">
        <DocLayout sections={SECTIONS}>
          <LegalDocHeader
            title="Privacy policy"
            summary="We verify college emails so every member is a real student. This document explains what we keep, how anonymous posting works, and how you stay in control of your data."
            meta={["Updated 2 November 2026", "Built to follow India's DPDP Act, 2023"]}
          />

          <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-surface p-3.5 text-center">
              <p className="text-xs font-semibold text-fg">DPDP Act, 2023</p>
              <p className="mt-1 text-xs text-fg-muted">Built to follow it</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3.5 text-center">
              <p className="text-xs font-semibold text-fg">No data sales</p>
              <p className="mt-1 text-xs text-fg-muted">No ads based on your activity</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3.5 text-center">
              <p className="text-xs font-semibold text-fg">Sealed identity</p>
              <p className="mt-1 text-xs text-fg-muted">Anonymous posts</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3.5 text-center">
              <p className="text-xs font-semibold text-fg">Delete any time</p>
              <p className="mt-1 text-xs text-fg-muted">From Profile Settings</p>
            </div>
          </div>

          <DocSection id="collect" number={1} title="What we collect">
            <DocTable
              rows={[
                {
                  label: "College email address",
                  value: "Verification only",
                  note: "Used to verify you belong to a recognised institution. Never displayed on your public profile, never sold or rented.",
                },
                {
                  label: "Profile details",
                  value: "Name, branch, graduation year, bio, interests",
                  note: "Whatever you choose to display. All fields are editable at any time, and non-essential fields are optional.",
                },
                {
                  label: "Content you post",
                  value: "Posts, comments, polls, notes, stories",
                  note: "Stored on serverless Postgres behind Cloudflare so it can be shown to peers in your campus feed.",
                },
                {
                  label: "Security telemetry",
                  value: "Session tokens, coarse device information",
                  note: "Retained to detect account takeovers, brute-force logins and spam. Never linked to advertising brokers.",
                },
              ]}
            />
          </DocSection>

          <DocSection id="anonymity" number={2} title="How anonymity works">
            <p>{ANONYMITY_STATEMENT}</p>
            <DocList
              items={[
                "Anonymous posts and confessions show a pseudonym, not your profile.",
                "Before publishing, a client-side check warns you if phone numbers, roll numbers or personal emails might identify you.",
              ]}
            />
            <DocNote>
              Anonymity protects you from social retaliation by peers. It is not an exemption from Indian law,
              and it never covers threats, extortion, cyberbullying or content involving minors.
            </DocNote>
          </DocSection>

          <DocSection id="analytics" number={3} title="Analytics and tracking">
            <p>
              We use Google Analytics for anonymous page statistics, only after you agree. We never sell your
              data or run ads based on your activity.
            </p>
          </DocSection>

          <DocSection id="sharing" number={4} title="What we never do">
            <DocList
              items={[
                "We do not sell, rent or trade your personal data or browsing behaviour to data brokers.",
                "We do not expose your college email address to recruiters, advertisers or other students.",
                "We do not run ads based on your activity.",
                "We do not read or analyse your private messages for advertising or profiling.",
              ]}
            />
          </DocSection>

          <DocSection id="rights" number={5} title="Your rights">
            <p>
              As a Data Principal under the Digital Personal Data Protection Act, 2023, you can exercise these
              rights at any time:
            </p>
            <DocList
              items={[
                <>
                  <span className="font-semibold text-fg">Right to access:</span> review the data linked to your
                  account from your Profile Settings.
                </>,
                <>
                  <span className="font-semibold text-fg">Right to correction:</span> update or edit any profile
                  detail instantly.
                </>,
                <>
                  <span className="font-semibold text-fg">Right to erasure:</span> request permanent deletion
                  of your account and personal identifiers at{" "}
                  <a href="mailto:privacy@campusloop.space" className="font-semibold text-brand-text underline-offset-4 hover:underline">
                    privacy@campusloop.space
                  </a>
                  .
                </>,
                <>
                  <span className="font-semibold text-fg">Right to grievance redressal:</span> escalate any
                  dispute to our Grievance Officer.
                </>,
              ]}
            />
          </DocSection>

          <DocSection id="security" number={6} title="Storage and encryption">
            <p>
              Traffic is encrypted in transit with TLS and at rest on Neon serverless PostgreSQL behind
              Cloudflare. The link between an anonymous post and its author is encrypted separately from the
              post itself.
            </p>
          </DocSection>

          <DocSection id="officer" number={7} title="Data Protection and Grievance Officer">
            <p>
              Designated under the DPDP Act, 2023 and Rule 3(2) of the Information Technology (Intermediary
              Guidelines and Digital Media Ethics Code) Rules, 2021.
            </p>
            <DocTable
              rows={[
                { label: "Grievance Officer", value: "Shaswat Raj" },
                {
                  label: "Official email",
                  value: (
                    <a href="mailto:grievance@campusloop.space" className="font-mono text-brand-text underline-offset-4 hover:underline">
                      grievance@campusloop.space
                    </a>
                  ),
                },
                {
                  label: "Privacy requests",
                  value: (
                    <a href="mailto:privacy@campusloop.space" className="font-mono text-brand-text underline-offset-4 hover:underline">
                      privacy@campusloop.space
                    </a>
                  ),
                },
                { label: "Response time", value: "Within 24 to 48 working hours" },
                { label: "Founder", value: "Shaswat Raj" },
                { label: "Legal entity", value: "CampusLoop (not yet incorporated)" },
              ]}
            />
          </DocSection>
        </DocLayout>
      </main>
    </MarketingShell>
  );
}

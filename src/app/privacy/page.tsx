import type { Metadata } from "next";
import { CleanFooter } from "@/components/landing/clean-footer";
import { MinimalLandingNavbar } from "@/components/landing/minimal-landing-navbar";
import {
  DocLayout,
  DocList,
  DocNote,
  DocSection,
  type DocSectionRef,
  DocTable,
  LegalDocHeader,
} from "@/components/marketing/legal-doc";
import { LegalNav } from "@/components/marketing/legal-nav";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how CampusLoop protects student data, cryptographic anonymity, and complies with the Digital Personal Data Protection Act (DPDP Act 2023) and IT Act 2000.",
  keywords: [
    "Privacy Policy",
    "CampusLoop Privacy",
    "DPDP Act 2023",
    "Data Principal Rights",
    "Student Data Protection",
    "Anonymous Cryptography",
    "Data Protection Officer India",
  ],
  alternates: { canonical: "https://campusloop.space/privacy" },
  openGraph: {
    title: "Privacy Policy",
    description: "Learn how CampusLoop protects student data and cryptographic anonymity.",
    url: "https://campusloop.space/privacy",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://campusloop.space/og-image.png",
        width: 1200,
        height: 630,
        alt: "Privacy Policy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy",
    description: "Learn how CampusLoop protects student data and cryptographic anonymity.",
    images: ["https://campusloop.space/og-image.png"],
  },
  robots: { index: true, follow: true },
};

const SECTIONS: DocSectionRef[] = [
  { id: "collect", label: "What we collect" },
  { id: "anonymity", label: "How anonymity works" },
  { id: "sharing", label: "What we never do" },
  { id: "rights", label: "Your rights" },
  { id: "security", label: "Storage & encryption" },
  { id: "officer", label: "Grievance officer" },
];

export default function PrivacyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "CampusLoop Privacy Policy",
    url: "https://campusloop.space/privacy",
    description: "How CampusLoop collects, uses, and protects student data under the DPDP Act 2023.",
    publisher: {
      "@type": "Organization",
      name: "CampusLoop Inc.",
      url: "https://campusloop.space",
      logo: "https://campusloop.space/logo.png",
    },
    inLanguage: "en-IN",
    datePublished: "2026-01-01",
    dateModified: "2026-08-28",
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground select-none">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MinimalLandingNavbar />
      <LegalNav />

      <main className="flex-1 py-8 sm:py-12">
        <DocLayout sections={SECTIONS}>
          <LegalDocHeader
            eyebrow="DPDP Act 2023 Compliant"
            title="Privacy policy"
            summary="We verify institutional college emails so every user is an authentic peer. This document details our cryptographic data architecture — what is retained, what is protected by zero-knowledge keys, and how you retain 100% control over your data."
            meta={["Updated 28 August 2026", "DPDP Act, 2023", "CampusLoop Trust & Safety"]}
          />

          {/* Voxel Highlights Bar */}
          <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-border/70 bg-card/80 p-3.5 text-center shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Statutory</span>
              <p className="mt-1 text-xs font-bold text-foreground">DPDP Act 2023</p>
              <p className="text-[10px] text-muted-foreground">Certified Compliance</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/80 p-3.5 text-center shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-500">Zero Ad Tech</span>
              <p className="mt-1 text-xs font-bold text-foreground">0 Ad Trackers</p>
              <p className="text-[10px] text-muted-foreground">No Profile Reselling</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/80 p-3.5 text-center shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-500">Cryptography</span>
              <p className="mt-1 text-xs font-bold text-foreground">Sealed Keys</p>
              <p className="text-[10px] text-muted-foreground">Anon Escrow</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/80 p-3.5 text-center shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">Student First</span>
              <p className="mt-1 text-xs font-bold text-foreground">1-Tap Erasure</p>
              <p className="text-[10px] text-muted-foreground">Permanent Delete</p>
            </div>
          </div>

          <DocSection id="collect" number={1} title="What we collect">
            <DocTable
              rows={[
                {
                  label: "College email address",
                  value: "Verification only",
                  note: "Used strictly to verify you belong to an accredited institution (.ac.in, .edu). Never displayed on your public profile, never sold or rented.",
                },
                {
                  label: "Profile details",
                  value: "Name, branch, graduation year, bio, interests",
                  note: "Whatever you choose to display. All fields are editable at any time, and non-essential fields are completely optional.",
                },
                {
                  label: "Content you post",
                  value: "Posts, comments, polls, lecture notes, stories",
                  note: "Stored on serverless Postgres behind Cloudflare edge so it can be rendered to peers in your campus feed.",
                },
                {
                  label: "Security telemetry",
                  value: "Session tokens, coarse device information",
                  note: "Retained to detect account takeovers, brute force logins, and spam flooding. Never linked to advertising brokers.",
                },
              ]}
            />
          </DocSection>

          <DocSection id="anonymity" number={2} title="How anonymity works">
            <p>
              Anonymous posts and confessions are decoupled at write-time — the direct database link to
              your user profile is stripped before persistence.
            </p>
            <DocList
              items={[
                "Stored posts carry an ephemeral pseudonym handle, not your profile ID. There is no foreign key left to join against in the public schema.",
                "Recovering the author identity requires an audited cryptographic key escrow stored in isolated hardware security modules, accessible only for statutory police or anti-ragging escalations.",
                "No student, senior, college administrator, or faculty member can inspect the author of an anonymous confession through any app interface.",
                "Before publishing, client-side regex scans your text to warn you if phone numbers, roll numbers, or personal emails might inadvertently identify you.",
              ]}
            />
            <DocNote>
              Anonymity protects you from social retaliation by peers. It is not an exemption from Indian law,
              and it never covers threats, extortion, cyberbullying, or content involving minors.
            </DocNote>
          </DocSection>

          <DocSection id="sharing" number={3} title="What we never do">
            <DocList
              items={[
                "We do not sell, rent, or trade your personal data or browsing behavior to data brokers.",
                "We do not expose your institutional email address to recruiters, advertisers, or other students.",
                "We do not inject third-party ad pixels or tracking cookies across your campus feeds.",
                "We do not read or analyze your private peer messages for advertising or machine learning profiling.",
              ]}
            />
          </DocSection>

          <DocSection id="rights" number={4} title="Your statutory rights">
            <p>
              As a Data Principal under the Digital Personal Data Protection Act, 2023, you hold these
              statutory rights, exercisable directly at any time:
            </p>
            <DocList
              items={[
                <>
                  <span className="font-bold text-foreground">Right to Access:</span> Review all data
                  linked to your account from your Profile Settings.
                </>,
                <>
                  <span className="font-bold text-foreground">Right to Correction:</span> Update, edit, or
                  modify any biographical or profile details instantly.
                </>,
                <>
                  <span className="font-bold text-foreground">Right to Erasure:</span> Request permanent
                  deletion of your account and personal identifiers at{" "}
                  <a
                    href="mailto:privacy@campusloop.space"
                    className="text-[#16a34a] font-bold underline-offset-4 hover:underline"
                  >
                    privacy@campusloop.space
                  </a>
                  .
                </>,
                <>
                  <span className="font-bold text-foreground">Right to Grievance Redressal:</span> Escalate
                  any dispute to our designated Grievance Officer.
                </>,
              ]}
            />
          </DocSection>

          <DocSection id="security" number={5} title="Storage and encryption">
            <p>
              All traffic is encrypted in transit using TLS 1.3 and at rest with AES-256 encryption on Neon
              serverless PostgreSQL behind Cloudflare edge firewalls. Anonymous authorship credentials are
              sealed with dedicated cryptographic escrow tokens.
            </p>
          </DocSection>

          <DocSection id="officer" number={6} title="Data Protection & Grievance Officer">
            <p>
              Appointed under Section 10 of the DPDP Act, 2023 and Rule 3(2) of the Information Technology
              (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.
            </p>
            <DocTable
              rows={[
                { label: "Designated Officer", value: "Data Protection & Grievance Officer" },
                {
                  label: "Official Email",
                  value: (
                    <a
                      href="mailto:privacy@campusloop.space"
                      className="font-mono text-xs sm:text-sm text-[#16a34a] font-bold underline-offset-4 hover:underline"
                    >
                      privacy@campusloop.space
                    </a>
                  ),
                },
                { label: "Statutory SLA", value: "Response within 24–48 working hours" },
                { label: "Corporate Entity", value: "CampusLoop Inc., Registered in India" },
              ]}
            />
          </DocSection>
        </DocLayout>
      </main>

      <CleanFooter />
    </div>
  );
}

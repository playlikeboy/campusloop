import type { Metadata } from "next";
import { Phone } from "lucide-react";
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

export const metadata: Metadata = {
  title: "Safety · CampusLoop",
  description:
    "Community standards, zero-tolerance anti-ragging policy under UGC regulations, personal information filters, reporting and moderation, and emergency helplines.",
  keywords: ["Safety Guidelines", "Anti-Ragging UGC", "CampusLoop Safety", "Student Protection", "Cyberbullying Prevention", "Emergency Helplines India"],
  alternates: { canonical: "https://campusloop.space/safety" },
  openGraph: {
    title: "Safety · CampusLoop",
    description: "Community standards, anti-ragging policy, reporting and emergency helplines.",
    url: "https://campusloop.space/safety",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://campusloop.space/og-image.png", width: 1200, height: 630, alt: "Safety and community standards" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Safety · CampusLoop",
    description: "Community standards, anti-ragging policy, reporting and emergency helplines.",
    images: ["https://campusloop.space/og-image.png"],
  },
  robots: { index: true, follow: true },
};

const SECTIONS: DocSectionRef[] = [
  { id: "standards", label: "Community standards" },
  { id: "ragging", label: "Anti-ragging policy" },
  { id: "doxxing", label: "Personal information" },
  { id: "moderation", label: "Reporting and moderation" },
  { id: "match", label: "Campus Match safety" },
  { id: "helplines", label: "Emergency helplines" },
];

const HELPLINES = [
  {
    name: "National Anti-Ragging Helpline",
    tag: "24x7, toll-free",
    number: "1800-180-5522",
    tel: "18001805522",
    note: "For all universities across India.",
  },
  {
    name: "KIRAN mental health helpline",
    tag: "13 languages",
    number: "1800-599-0019",
    tel: "18005990019",
    note: "Government of India 24x7 mental health and counselling support.",
  },
  {
    name: "Women helpline and emergency",
    tag: "Emergency",
    number: "1091 / 112",
    tel: "112",
    note: "National emergency response across India.",
  },
];

export default function SafetyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "CampusLoop Safety and Community Standards",
    url: "https://campusloop.space/safety",
    description: "Community safety guidelines and anti-ragging protocols under UGC regulations for CampusLoop.",
    publisher: {
      "@type": "Organization",
      name: "CampusLoop",
      legalName: "CampusLoop (not yet incorporated)",
      url: "https://campusloop.space",
      logo: "https://campusloop.space/logo.png",
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
            title="Safety and community standards"
            summary="CampusLoop is a student space gated by college email. This page explains the automated filters, human review and zero-tolerance rules that protect student life."
            meta={["Updated 2 November 2026", "UGC Anti-Ragging Regulations, 2009"]}
          />

          <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-surface p-3.5 text-center">
              <p className="text-xs font-semibold text-fg">Anti-ragging</p>
              <p className="mt-1 text-xs text-fg-muted">Zero tolerance, UGC 2009</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3.5 text-center">
              <p className="text-xs font-semibold text-fg">Anti-doxxing</p>
              <p className="mt-1 text-xs text-fg-muted">Phone and room number filter</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3.5 text-center">
              <p className="text-xs font-semibold text-fg">Three reports</p>
              <p className="mt-1 text-xs text-fg-muted">Hidden until human review</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3.5 text-center">
              <p className="text-xs font-semibold text-fg">Emergency 24x7</p>
              <p className="mt-1 text-xs text-fg-muted">1800-180-5522</p>
            </div>
          </div>

          <DocSection id="standards" number={1} title="What we expect from students">
            <p>
              Every verified profile maps to a college email, so conversations are real and misconduct carries
              real accountability. Treat your digital campus like a hostel common room.
            </p>
            <DocList
              items={[
                "Post under your verified name or your anonymous handle. Never impersonate others.",
                "Disagree with ideas, not with personal attacks or pile-ons.",
                "Do not post photos or private conversations of others without consent.",
                "Content involving coercion, threats, blackmail or harm is hidden immediately on report.",
              ]}
            />
          </DocSection>

          <DocSection id="ragging" number={2} title="Zero tolerance anti-ragging policy">
            <p>
              In line with the{" "}
              <span className="font-semibold text-fg">
                UGC Regulations on Curbing the Menace of Ragging in Higher Educational Institutions (2009)
              </span>
              , CampusLoop treats digital hazing and cyber-ragging the same as physical offences. This covers
              intimidation, forced tasks, humiliating junior students and coercive threats in hubs or chats.
            </p>
            <DocNote>
              A substantiated ragging offence results in permanent account termination, loss of all Loop
              Points, and reporting to the college&apos;s Anti-Ragging Committee and, where required, law
              enforcement.
            </DocNote>
          </DocSection>

          <DocSection id="doxxing" number={3} title="Anti-doxxing and personal information filters">
            <p>
              Because the network connects residential campuses, publishing someone&apos;s whereabouts is a
              physical risk. Automated filters flag and redact:
            </p>
            <DocList
              items={[
                "Personal mobile numbers and unverified external chat invite links.",
                "Hostel block names paired with room numbers and student roll numbers.",
                "Personal emails published to solicit targeted harassment.",
                "Images or videos from inside hostel rooms without consent.",
              ]}
            />
          </DocSection>

          <DocSection id="moderation" number={4} title="Reporting and moderation">
            <p>
              Every post, story, confession and comment has a one-tap Report option. Reports are triaged
              automatically and reviewed by people:
            </p>
            <DocTable
              rows={[
                {
                  label: "Automatic hide",
                  value: "After three independent reports",
                  note: "Flagged content is removed from campus feeds while it is reviewed.",
                },
                {
                  label: "Human review",
                  value: "Within 24 hours; safety reports within 12",
                  note: "High-severity safety flags skip the standard queue.",
                },
                {
                  label: "Action",
                  value: "Warning, temporary timeout, permanent ban",
                  note: "Every moderation action is logged.",
                },
              ]}
            />
          </DocSection>

          <DocSection id="match" number={5} title="Campus Match and Secret Crush safety">
            <p>
              Campus Match and Secret Crush are for verified students aged 18 and older. One-sided interest is
              never disclosed:
            </p>
            <DocList
              items={[
                <>
                  <span className="font-semibold text-fg">Secret Crush stays sealed:</span> your crush is never
                  shown unless both of you add each other.
                </>,
                <>
                  <span className="font-semibold text-fg">Unmatch and block:</span> blocking someone removes
                  the chat and hides you from each other across discovery.
                </>,
                <>
                  <span className="font-semibold text-fg">Meet safely:</span> meet in public campus spaces and
                  tell a friend.
                </>,
              ]}
            />
          </DocSection>

          <DocSection id="helplines" number={6} title="Emergency student helplines">
            <p>
              If you or a classmate is in immediate distress or danger, contact an emergency helpline first.
              These national helplines are free and confidential:
            </p>

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              {HELPLINES.map((line) => (
                <div key={line.number} className="space-y-2 rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-fg">{line.name}</span>
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-fg-muted">{line.tag}</span>
                  </div>
                  <p className="font-mono text-lg font-semibold tabular-nums text-fg">{line.number}</p>
                  <p className="text-xs leading-normal text-fg-muted">{line.note}</p>
                  <a
                    href={`tel:${line.tel}`}
                    className="inline-flex h-10 items-center gap-1.5 rounded-md bg-danger px-3 text-xs font-semibold text-danger-fg transition-opacity hover:opacity-90"
                  >
                    <Phone className="size-3.5" aria-hidden />
                    <span>Call {line.number.split(" / ")[0]}</span>
                  </a>
                </div>
              ))}

              <div className="space-y-2 rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-fg">CampusLoop safety desk</span>
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-fg-muted">Within 12 hours</span>
                </div>
                <p className="font-mono text-sm font-semibold text-fg">safety@campusloop.space</p>
                <p className="text-xs leading-normal text-fg-muted">Direct escalation for urgent campus harassment incidents.</p>
                <a
                  href="mailto:safety@campusloop.space"
                  className="inline-flex h-10 items-center gap-1.5 rounded-md bg-brand px-3 text-xs font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
                >
                  <span>Email the safety desk</span>
                </a>
              </div>
            </div>
          </DocSection>
        </DocLayout>
      </main>
    </MarketingShell>
  );
}

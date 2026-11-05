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
  title: "Terms of Service · CampusLoop",
  description:
    "Who can join CampusLoop, what you may post, how moderation and suspension work, and how to reach the Grievance Officer under IT Rules 2021.",
  keywords: ["Terms of Service", "CampusLoop Terms", "User Agreement", "IT Rules 2021", "Grievance Officer"],
  alternates: { canonical: "https://campusloop.space/terms" },
  openGraph: {
    title: "Terms of Service · CampusLoop",
    description: "Who can join, what you may post, and how moderation works.",
    url: "https://campusloop.space/terms",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://campusloop.space/og-image.png", width: 1200, height: 630, alt: "Terms of Service" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service · CampusLoop",
    description: "Who can join, what you may post, and how moderation works.",
    images: ["https://campusloop.space/og-image.png"],
  },
  robots: { index: true, follow: true },
};

const SECTIONS: DocSectionRef[] = [
  { id: "eligibility", label: "Who can join" },
  { id: "account", label: "Your account" },
  { id: "prohibited", label: "Prohibited content" },
  { id: "anonymity", label: "Responsible anonymity" },
  { id: "moderation", label: "Moderation and takedown" },
  { id: "termination", label: "Suspension" },
  { id: "grievance", label: "Grievance officer" },
];

export default function TermsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "CampusLoop Terms of Service",
    url: "https://campusloop.space/terms",
    description: "Terms governing use of CampusLoop, including eligibility, prohibited content under IT Rules 2021, and grievance redressal.",
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
            title="Terms of service"
            summary="By creating an account on CampusLoop you agree to these terms. They set the code of conduct that keeps campus spaces safe, civil and useful."
            meta={["Updated 2 November 2026", "IT Rules, 2021"]}
          />

          <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-surface p-3.5 text-center">
              <p className="text-xs font-semibold text-fg">IT Rules 2021</p>
              <p className="mt-1 text-xs text-fg-muted">Rule 3(1) and 3(2)</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3.5 text-center">
              <p className="text-xs font-semibold text-fg">College email</p>
              <p className="mt-1 text-xs text-fg-muted">For verified students</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3.5 text-center">
              <p className="text-xs font-semibold text-fg">Anti-ragging</p>
              <p className="mt-1 text-xs text-fg-muted">Zero tolerance</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3.5 text-center">
              <p className="text-xs font-semibold text-fg">Human review</p>
              <p className="mt-1 text-xs text-fg-muted">Reports within 24 hours</p>
            </div>
          </div>

          <DocSection id="eligibility" number={1} title="Who can join">
            <p>
              Students at Indian colleges join with their college email and get a verified tick. Anyone else
              can sign up with another email and use CampusLoop in Campus Preview.
            </p>
            <DocTable
              rows={[
                {
                  label: "Verified student",
                  value: "Full access",
                  note: "Join with a college email. Post, share notes, comment, vote, chat and, if 18 or older, use Campus Match.",
                },
                {
                  label: "Campus Preview",
                  value: "Near-full access, no verified tick",
                  note: "Any other email. Browse college hubs, feeds and the Academic Vault and take part in open spaces. Verified-only spaces stay closed until you verify a college email.",
                },
                {
                  label: "Faculty and alumni",
                  value: "Not a separate role",
                  note: "CampusLoop is built for current students. Faculty and alumni without a current college email use Campus Preview.",
                },
                {
                  label: "Campus Match and Secret Crush",
                  value: "Ages 18 and above",
                  note: "Restricted to verified students who are 18 or older.",
                },
              ]}
            />
          </DocSection>

          <DocSection id="account" number={2} title="Your account responsibility">
            <p>
              One student, one account. You are responsible for activity performed under your credentials:
            </p>
            <DocList
              items={[
                "Do not run automated bot accounts, scrape student directories or spoof verification links.",
                "Do not impersonate other students, faculty, college staff or student societies.",
                "Do not attempt to gain unauthorised access to other campus hubs or accounts.",
              ]}
            />
          </DocSection>

          <DocSection id="prohibited" number={3} title="Prohibited content">
            <p>
              Under Rule 3(1)(b) of the Information Technology (Intermediary Guidelines and Digital Media
              Ethics Code) Rules, 2021, you may not publish content that:
            </p>
            <DocList
              items={[
                "Exposes private personal information (doxxing), including hostel room numbers, personal contact numbers or student roll IDs.",
                "Promotes cyberbullying, harassment, intimidation, defamation or hate speech targeting individuals or communities.",
                "Contains explicit adult content or non-consensual media under Sections 67 and 67A of the IT Act.",
                "Facilitates exam cheating, paper leaks or academic fraud.",
                "Involves minors in any sexual or exploitative context. This is reported to the police immediately.",
              ]}
            />
          </DocSection>

          <DocSection id="anonymity" number={4} title="Responsible anonymity">
            <p>
              Anonymity exists so students can raise real concerns about hostels, academics and mental
              well-being without fear of reprisal.
            </p>
            <p>{ANONYMITY_STATEMENT}</p>
            <DocNote>
              Anonymity is a shield for vulnerability, not a cover for harassment. Accounts that target peers
              from behind a pseudonym are suspended, and identities are disclosed when ordered by a competent
              authority.
            </DocNote>
          </DocSection>

          <DocSection id="moderation" number={5} title="Moderation and takedown">
            <p>
              Content that receives three independent reports is hidden from the campus feed until a human
              moderator reviews it, within 24 hours.
            </p>
            <p>
              When content is removed, the creator receives an explanation of the violation and can appeal to
              the safety desk.
            </p>
          </DocSection>

          <DocSection id="termination" number={6} title="Suspension and removal">
            <p>
              CampusLoop may suspend or terminate accounts that breach these terms. Severe offences, including
              ragging, threats of violence or sexual harassment, result in permanent removal and notification
              to the institution&apos;s disciplinary committee.
            </p>
            <p>You can permanently delete your account at any time from Profile Settings.</p>
          </DocSection>

          <DocSection id="grievance" number={7} title="Grievance redressal">
            <p>
              Designated under Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital
              Media Ethics Code) Rules, 2021.
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
                { label: "Acknowledgement", value: "Within 24 hours of receipt" },
                { label: "Resolution", value: "Within 15 days, per IT Rules 2021" },
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

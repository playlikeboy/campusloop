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
  title: "Terms of Service",
  description:
    "Terms of Service, Intermediary Guidelines under Rule 3(1) of Information Technology Rules 2021, and user agreement for CampusLoop.",
  keywords: [
    "Terms of Service",
    "CampusLoop Terms",
    "User Agreement",
    "IT Rules 2021",
    "Intermediary Guidelines",
    "Student Social Network Terms",
    "Grievance Officer India",
  ],
  alternates: { canonical: "https://campusloop.space/terms" },
  openGraph: {
    title: "Terms of Service",
    description: "Terms of Service, Intermediary Guidelines, and user agreement for CampusLoop.",
    url: "https://campusloop.space/terms",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://campusloop.space/og-image.png",
        width: 1200,
        height: 630,
        alt: "Terms of Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service",
    description: "Terms of Service, Intermediary Guidelines, and user agreement for CampusLoop.",
    images: ["https://campusloop.space/og-image.png"],
  },
  robots: { index: true, follow: true },
};

const SECTIONS: DocSectionRef[] = [
  { id: "eligibility", label: "Who can join" },
  { id: "account", label: "Your account" },
  { id: "prohibited", label: "Prohibited content" },
  { id: "anonymity", label: "Responsible anonymity" },
  { id: "moderation", label: "Moderation & takedown" },
  { id: "termination", label: "Suspension" },
  { id: "grievance", label: "Grievance officer" },
];

export default function TermsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "CampusLoop Terms of Service",
    url: "https://campusloop.space/terms",
    description:
      "Terms governing use of CampusLoop, including eligibility, prohibited content under IT Rules 2021, and grievance redressal.",
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
            eyebrow="Rule 3(1) IT Rules 2021"
            title="Terms of service"
            summary="By creating an account on CampusLoop, you agree to these terms. They establish the code of conduct that keeps campus spaces safe, civil, and academically empowering."
            meta={["Updated 28 August 2026", "IT Rules, 2021", "CampusLoop Trust & Safety"]}
          />

          {/* Voxel Terms Highlights Bar */}
          <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-border/70 bg-card/80 p-3.5 text-center shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">
                Rule 3(1)
              </span>
              <p className="mt-1 text-xs font-bold text-foreground">IT Rules 2021</p>
              <p className="text-[10px] text-muted-foreground">Statutory Standard</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/80 p-3.5 text-center shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-500">
                Gated Network
              </span>
              <p className="mt-1 text-xs font-bold text-foreground">Students Only</p>
              <p className="text-[10px] text-muted-foreground">Verified Email Gate</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/80 p-3.5 text-center shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-500">
                Zero Tolerance
              </span>
              <p className="mt-1 text-xs font-bold text-foreground">Anti-Ragging</p>
              <p className="text-[10px] text-muted-foreground">UGC Regulations</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/80 p-3.5 text-center shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-500">
                Safe Quarantine
              </span>
              <p className="mt-1 text-xs font-bold text-foreground">24h SLA</p>
              <p className="text-[10px] text-muted-foreground">Moderator Escrow</p>
            </div>
          </div>

          <DocSection id="eligibility" number={1} title="Who can join">
            <p>
              CampusLoop is built strictly for active students, faculty, and recent alumni at recognized
              Indian universities. Publishing content requires verified institutional email authentication.
            </p>
            <DocTable
              rows={[
                {
                  label: "Verified student",
                  value: "Full access",
                  note: "Post confessions, share notes, comment, vote, chat, and participate in Campus Match. Requires a .ac.in or .edu address.",
                },
                {
                  label: "Prospective visitor",
                  value: "Read-only access",
                  note: "Prospective students can explore public college hubs, fests, and campus discovery without posting privileges.",
                },
                {
                  label: "Campus Match",
                  value: "Ages 18 and above",
                  note: "Dating and Secret Crush features are restricted to verified adult students.",
                },
              ]}
            />
          </DocSection>

          <DocSection id="account" number={2} title="Your account responsibility">
            <p>
              One student, one account. You are solely responsible for activities performed under your
              authenticated credentials:
            </p>
            <DocList
              items={[
                "Do not deploy automated bot accounts, scrape student directories, or spoof institutional verification links.",
                "Do not impersonate other students, faculty professors, college deans, or student societies.",
                "Do not attempt to compromise institutional fences or gain unauthorized access to other campus hubs.",
              ]}
            />
          </DocSection>

          <DocSection id="prohibited" number={3} title="Prohibited content">
            <p>
              Pursuant to Rule 3(1)(b) of the Information Technology (Intermediary Guidelines and Digital
              Media Ethics Code) Rules, 2021, users are strictly forbidden from publishing content that:
            </p>
            <DocList
              items={[
                "Exposes private personal information (doxxing), including hostel room numbers, personal contact numbers, or student roll IDs.",
                "Promotes cyberbullying, harassment, intimidation, defamation, or hate speech targeting individuals or communities.",
                "Disseminates explicit adult pornography or non-consensual media under Sections 67 and 67A of the IT Act.",
                "Facilitates exam cheating rings, illicit paper leaks, or unauthorized academic fraud.",
                "Involves minors in any sexual or exploitative context, which triggers immediate statutory police reporting.",
              ]}
            />
          </DocSection>

          <DocSection id="anonymity" number={4} title="Responsible anonymity">
            <p>
              Cryptographic anonymity exists to empower students to voice genuine concerns regarding hostel
              infrastructure, academic grievances, and mental well-being without fear of reprisal.
            </p>
            <DocNote>
              Anonymity is a shield for vulnerability, not a cloak for harassment. Accounts attempting to
              target peers from behind an anonymous pseudonym face immediate suspension and legal unmasking
              when ordered by competent judicial authorities.
            </DocNote>
          </DocSection>

          <DocSection id="moderation" number={5} title="Moderation & automated escrow">
            <p>
              Content receiving three independent student reports automatically enters quarantine escrow,
              hiding it from the campus feed until human safety moderators review it within 24 hours.
            </p>
            <p>
              When content is removed, the creator receives a clear explanation detailing the violation.
              Users can file an in-app appeal directly with the safety desk.
            </p>
          </DocSection>

          <DocSection id="termination" number={6} title="Suspension and removal">
            <p>
              CampusLoop reserves the right to suspend or terminate accounts that consistently breach these
              terms. Severe offences — including ragging, threats of violence, or sexual harassment — result
              in permanent account revocation and notification to the institution&apos;s disciplinary
              committee.
            </p>
            <p>
              You may also choose to permanently delete your account at any time from Profile Settings.
            </p>
          </DocSection>

          <DocSection id="grievance" number={7} title="Statutory Grievance Redressal">
            <p>
              Designated in compliance with Rule 3(2) of the Information Technology (Intermediary
              Guidelines and Digital Media Ethics Code) Rules, 2021.
            </p>
            <DocTable
              rows={[
                { label: "Grievance Officer", value: "Designated Grievance Redressal Officer" },
                {
                  label: "Official Email",
                  value: (
                    <a
                      href="mailto:grievance@campusloop.space"
                      className="font-mono text-xs sm:text-sm text-[#16a34a] font-bold underline-offset-4 hover:underline"
                    >
                      grievance@campusloop.space
                    </a>
                  ),
                },
                { label: "Acknowledgement SLA", value: "Within 24 hours of receipt" },
                { label: "Statutory Resolution", value: "Within 15 days, per IT Rules 2021" },
              ]}
            />
          </DocSection>
        </DocLayout>
      </main>

      <CleanFooter />
    </div>
  );
}

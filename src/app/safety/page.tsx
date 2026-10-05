import type { Metadata } from "next";
import { Phone, ShieldAlert, ShieldCheck } from "lucide-react";
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
  title: "Safety & Community Standards",
  description:
    "Community safety guidelines, zero-tolerance anti-ragging protocols under UGC regulations, automated doxxing filters, and student reporting mechanisms.",
  keywords: [
    "Safety Guidelines",
    "Anti-Ragging UGC",
    "CampusLoop Safety",
    "Student Protection",
    "Cyberbullying Prevention",
    "Dating Safety Rules",
    "Emergency Support India",
  ],
  alternates: { canonical: "https://campusloop.space/safety" },
  openGraph: {
    title: "Safety & Community Standards",
    description:
      "Learn how CampusLoop protects students with zero-tolerance anti-ragging and AI safety shields.",
    url: "https://campusloop.space/safety",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://campusloop.space/og-image.png",
        width: 1200,
        height: 630,
        alt: "Safety & Community Standards",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Safety & Community Standards",
    description:
      "Learn how CampusLoop protects students with zero-tolerance anti-ragging and AI safety shields.",
    images: ["https://campusloop.space/og-image.png"],
  },
  robots: { index: true, follow: true },
};

const SECTIONS: DocSectionRef[] = [
  { id: "standards", label: "Community standards" },
  { id: "ragging", label: "Anti-ragging policy" },
  { id: "doxxing", label: "Personal information" },
  { id: "moderation", label: "Reporting & moderation" },
  { id: "match", label: "Campus Match safety" },
  { id: "helplines", label: "Emergency helplines" },
];

export default function SafetyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "CampusLoop Safety & Community Standards",
    url: "https://campusloop.space/safety",
    description:
      "Community safety guidelines and anti-ragging protocols under UGC regulations for CampusLoop.",
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
            eyebrow="Zero Tolerance Anti-Ragging"
            title="Safety & community standards"
            summary="CampusLoop is an exclusive student sanctuary gated by official institutional emails. Here is how our automated safety filters, human review teams, and zero-tolerance protocols protect student life."
            meta={["Updated 28 August 2026", "UGC Anti-Ragging Regulations, 2009", "CampusLoop Trust & Safety"]}
          />

          {/* Voxel Safety Highlights Bar */}
          <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-3.5 text-center shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-500">
                Zero Tolerance
              </span>
              <p className="mt-1 text-xs font-bold text-foreground">Anti-Ragging</p>
              <p className="text-[10px] text-muted-foreground">UGC Regulations 2009</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/80 p-3.5 text-center shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#16a34a]">
                Anti-Doxxing
              </span>
              <p className="mt-1 text-xs font-bold text-foreground">Phone & Room Filter</p>
              <p className="text-[10px] text-muted-foreground">Auto Redaction</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/80 p-3.5 text-center shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-500">
                Escrow Quarantine
              </span>
              <p className="mt-1 text-xs font-bold text-foreground">3 Reports Trigger</p>
              <p className="text-[10px] text-muted-foreground">Instant Timeline Hide</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/80 p-3.5 text-center shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-500">
                Emergency 24x7
              </span>
              <p className="mt-1 text-xs font-bold text-foreground">Helpline Direct</p>
              <p className="text-[10px] text-muted-foreground">1800-180-5522</p>
            </div>
          </div>

          <DocSection id="standards" number={1} title="What we expect from verified students">
            <p>
              Every student profile maps to an active enrollment at an accredited university. This ensures
              authentic conversations, and it also ensures that malicious conduct carries real accountability.
              Treat your digital campus with the respect you would show a hostel common room.
            </p>
            <DocList
              items={[
                "Post authentically under your verified name or your encrypted anonymous handle — never impersonate others.",
                "Disagree with constructive ideas, not personal attacks or targeted pile-ons.",
                "Do not post non-consensual photographs or hostel corridor conversations without consent.",
                "Content involving coercion, threats, blackmail, or harm is quarantined immediately.",
              ]}
            />
          </DocSection>

          <DocSection id="ragging" number={2} title="Zero tolerance anti-ragging protocol">
            <p>
              In compliance with the{" "}
              <span className="font-bold text-foreground">
                UGC Regulations on Curbing the Menace of Ragging in Higher Educational Institutions (2009)
              </span>
              , CampusLoop classifies digital hazing and cyber-ragging as equivalent to physical offences.
              This covers intimidation, forced tasks, humiliating junior students, and coercive threats in
              public hubs or private chats.
            </p>
            <DocNote>
              A substantiated ragging offence triggers instant permanent account termination, forfeiture
              of all Loop Points (LP), and mandatory reporting to your university&apos;s statutory
              Anti-Ragging Committee and law enforcement agencies.
            </DocNote>
          </DocSection>

          <DocSection id="doxxing" number={3} title="Anti-doxxing & personal information filters">
            <p>
              Because our network connects residential campuses, releasing personal whereabouts presents
              immediate physical risk. Our automated filters proactively flag and redact:
            </p>
            <DocList
              items={[
                "Private mobile phone numbers and unverified external WhatsApp invite links.",
                "Hostel block names paired with specific room numbers and student roll numbers.",
                "Personal emails published with the intent to solicit targeted harassment.",
                "Images or videos captured inside residential hostel rooms without explicit consent.",
              ]}
            />
          </DocSection>

          <DocSection id="moderation" number={4} title="Reporting & moderation timeline">
            <p>
              Every post, story, confession, and comment has an intuitive one-tap report tool. Reports are
              evaluated algorithmically and verified by human moderators:
            </p>
            <DocTable
              rows={[
                {
                  label: "Automated quarantine",
                  value: "Triggered on 3 independent reports",
                  note: "The flagged content is immediately removed from campus feeds while under investigation.",
                },
                {
                  label: "Human review turnaround",
                  value: "Under 24 hours (Safety priority < 12h)",
                  note: "High-severity safety flags bypass the standard queue for immediate escalation.",
                },
                {
                  label: "Disciplinary action",
                  value: "Warning -> Temporary Timeout -> Permanent Ban",
                  note: "All administrative actions are logged with cryptographic audit trails.",
                },
              ]}
            />
          </DocSection>

          <DocSection id="match" number={5} title="Campus Match & Secret Crush safety">
            <p>
              Campus Match and Secret Crush are strictly gated to verified students aged 18 and older.
              They are engineered so one-sided interest is never disclosed:
            </p>
            <DocList
              items={[
                <>
                  <span className="font-bold text-foreground">Secret Crush Stays Sealed:</span> Your crush is
                  100% invisible unless both of you independently add each other to your crush lists.
                </>,
                <>
                  <span className="font-bold text-foreground">Instant Unmatch & Block:</span> Blocking a student
                  instantly erases mutual chat history and hides each other across all discovery features.
                </>,
                <>
                  <span className="font-bold text-foreground">Safe Campus Meetups:</span> Always meet in public,
                  well-lit campus hubs (like university canteens or central libraries) and tell a friend.
                </>,
              ]}
            />
          </DocSection>

          <DocSection id="helplines" number={6} title="Emergency student helplines">
            <p>
              If you or a classmate is in immediate distress or danger, contact emergency resources right
              away. These national helplines are free, confidential, and operational 24 hours a day:
            </p>

            {/* Voxel Emergency Helplines Cards */}
            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-red-500 flex items-center gap-1">
                    <ShieldAlert className="size-3.5" />
                    <span>UGC Anti-Ragging</span>
                  </span>
                  <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500">
                    24x7 Toll-Free
                  </span>
                </div>
                <p className="font-mono text-lg font-black text-foreground">1800-180-5522</p>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  National anti-ragging helpline for all universities across India.
                </p>
                <a
                  href="tel:18001805522"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 transition-colors shadow-xs"
                >
                  <Phone className="size-3" />
                  <span>Call 1800-180-5522</span>
                </a>
              </div>

              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-blue-500 flex items-center gap-1">
                    <ShieldCheck className="size-3.5" />
                    <span>KIRAN Mental Health</span>
                  </span>
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500">
                    13 Languages
                  </span>
                </div>
                <p className="font-mono text-lg font-black text-foreground">1800-599-0019</p>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Government of India 24x7 mental health & counseling support.
                </p>
                <a
                  href="tel:18005990019"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-600 transition-colors shadow-xs"
                >
                  <Phone className="size-3" />
                  <span>Call 1800-599-0019</span>
                </a>
              </div>

              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-purple-500">Women Helpline</span>
                  <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-500">
                    Emergency
                  </span>
                </div>
                <p className="font-mono text-lg font-black text-foreground">1091 / 112</p>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  National emergency response support for women safety across India.
                </p>
                <a
                  href="tel:112"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-purple-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-600 transition-colors shadow-xs"
                >
                  <Phone className="size-3" />
                  <span>Call 112</span>
                </a>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-[#16a34a]">CampusLoop Safety</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-[#16a34a]">
                    Priority &lt;12h
                  </span>
                </div>
                <p className="font-mono text-sm font-bold text-foreground">safety@campusloop.space</p>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Direct safety escalation desk for urgent campus harassment incidents.
                </p>
                <a
                  href="mailto:safety@campusloop.space"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#22c55e] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#16a34a] transition-colors shadow-xs"
                >
                  <span>Email Safety Desk</span>
                </a>
              </div>
            </div>
          </DocSection>
        </DocLayout>
      </main>

      <CleanFooter />
    </div>
  );
}

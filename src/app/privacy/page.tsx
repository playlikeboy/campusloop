import {
  DocLayout,
  DocList,
  DocNote,
  DocSection,
  type DocSectionRef,
  DocSummary,
  DocTable,
  LegalDocHeader,
  MailLink,
} from "@/components/marketing/legal-doc";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { breadcrumbJsonLd, buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "What CampusLoop collects, how anonymous posts work, what we never do with your data, and your rights under India's DPDP Act, 2023.",
  path: "/privacy",
});

const SECTIONS: DocSectionRef[] = [
  { id: "collect", label: "What we collect" },
  { id: "anonymity", label: "Anonymous posts" },
  { id: "analytics", label: "Analytics" },
  { id: "sharing", label: "What we never do" },
  { id: "rights", label: "Your rights" },
  { id: "security", label: "How data is stored" },
  { id: "officer", label: "Grievance Officer" },
];

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={[
          {
            "@type": "WebPage",
            name: "CampusLoop Privacy Policy",
            url: `${SITE_URL}/privacy`,
            inLanguage: "en-IN",
            dateModified: "2026-11-02",
            publisher: { "@id": `${SITE_URL}/#organization` },
          },
          breadcrumbJsonLd([{ name: "Privacy Policy", path: "/privacy" }]),
        ]}
      />
      <DocLayout
        sections={SECTIONS}
        header={
          <LegalDocHeader
            title="Privacy policy"
            summary="What we keep, how anonymous posts work, and how you stay in control of your data."
            meta={["Updated 2 November 2026", "Built to follow India's DPDP Act, 2023"]}
          />
        }
      >
        <DocSummary
          items={[
            "Your college email is only used to verify you. It is never shown or sold.",
            "Anonymous posts never show your name to anyone on CampusLoop.",
            "We don't sell your data or show ads based on what you do.",
            "You can ask for a copy of your data, fix it or delete it any time.",
          ]}
        />

        <DocSection id="collect" title="What we collect">
          <DocTable
            rows={[
              {
                label: "College email",
                value: "For verification only",
                note: "Confirms you study at a recognised college. Never shown on your profile, never sold or rented.",
              },
              {
                label: "Profile details",
                value: "Name, branch, graduation year, bio, interests",
                note: "Only what you choose to add. You can edit them any time, and most are optional.",
              },
              {
                label: "What you post",
                value: "Posts, comments, polls, notes, stories",
                note: "Stored on our database behind Cloudflare so classmates can see it in your campus feed.",
              },
              {
                label: "Security data",
                value: "Session tokens, basic device information",
                note: "Kept to catch account takeovers, password guessing and spam. Never shared with advertisers.",
              },
            ]}
          />
        </DocSection>

        <DocSection id="anonymity" title="Anonymous posts">
          <p>
            Anonymous posts never show your name or profile to anyone on CampusLoop, including classmates,
            seniors, faculty and college staff. Your identity is encrypted separately. CampusLoop can only
            recover it for a lawful order or a serious safety report, and every such access is logged.
          </p>
          <DocList
            items={[
              "Anonymous posts and confessions show a made-up name, not your profile.",
              "Before you post, we warn you if the text has a phone number, roll number or email that could identify you.",
            ]}
          />
          <DocNote>
            Anonymity protects you from classmates, not from Indian law. It never covers threats, extortion,
            bullying or content involving minors.
          </DocNote>
        </DocSection>

        <DocSection id="analytics" title="Analytics">
          <p>
            We use Google Analytics for anonymous page statistics, and only after you agree. We never sell
            your data or show ads based on your activity.
          </p>
        </DocSection>

        <DocSection id="sharing" title="What we never do">
          <DocList
            items={[
              "Sell, rent or trade your personal data or browsing history.",
              "Show your college email to recruiters, advertisers or other students.",
              "Show ads based on your activity.",
              "Read your private messages for ads or profiling.",
            ]}
          />
        </DocSection>

        <DocSection id="rights" title="Your rights">
          <p>Under the Digital Personal Data Protection Act, 2023, you can:</p>
          <DocList
            items={[
              <>
                <strong className="font-semibold text-fg">Get a copy of your data</strong> by emailing{" "}
                <MailLink email="privacy@campusloop.space" />.
              </>,
              <>
                <strong className="font-semibold text-fg">Correct it</strong> by editing your profile.
              </>,
              <>
                <strong className="font-semibold text-fg">Delete it:</strong> ask for your account and
                personal details to be deleted at <MailLink email="privacy@campusloop.space" />.
              </>,
              <>
                <strong className="font-semibold text-fg">Complain</strong> to our Grievance Officer if
                something goes wrong.
              </>,
            ]}
          />
        </DocSection>

        <DocSection id="security" title="How data is stored">
          <p>
            Data is encrypted in transit with TLS and at rest on Neon PostgreSQL behind Cloudflare. The link
            between an anonymous post and its author is encrypted separately from the post.
          </p>
        </DocSection>

        <DocSection id="officer" title="Data Protection and Grievance Officer">
          <p>
            Appointed under the DPDP Act, 2023 and Rule 3(2) of the Information Technology (Intermediary
            Guidelines and Digital Media Ethics Code) Rules, 2021.
          </p>
          <DocTable
            rows={[
              { label: "Grievance Officer", value: "Shaswat Raj" },
              { label: "Complaints", value: <MailLink email="grievance@campusloop.space" /> },
              { label: "Privacy requests", value: <MailLink email="privacy@campusloop.space" /> },
              { label: "We reply", value: "Within 24 to 48 working hours" },
              {
                label: "Legal entity",
                value: "CampusLoop (not yet incorporated), operated by founder Shaswat Raj",
              },
            ]}
          />
        </DocSection>
      </DocLayout>
    </MarketingShell>
  );
}

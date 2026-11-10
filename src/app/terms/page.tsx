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
  title: "Terms of Service",
  description:
    "Who can join CampusLoop, what you can't post, how reports and bans work, and how to reach our Grievance Officer under the IT Rules, 2021.",
  path: "/terms",
});

const UPDATED = "2 November 2026";

const SECTIONS: DocSectionRef[] = [
  { id: "eligibility", label: "Who can join" },
  { id: "account", label: "Your account" },
  { id: "prohibited", label: "What you can't post" },
  { id: "anonymity", label: "Anonymous posts" },
  { id: "moderation", label: "Reports and removal" },
  { id: "termination", label: "Suspension" },
  { id: "grievance", label: "Grievance Officer" },
];

export default function TermsPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={[
          {
            "@type": "WebPage",
            name: "CampusLoop Terms of Service",
            url: `${SITE_URL}/terms`,
            inLanguage: "en-IN",
            dateModified: "2026-11-02",
            publisher: { "@id": `${SITE_URL}/#organization` },
          },
          breadcrumbJsonLd([{ name: "Terms of Service", path: "/terms" }]),
        ]}
      />
      <DocLayout
        sections={SECTIONS}
        header={
          <LegalDocHeader
            title="Terms of service"
            summary="By making a CampusLoop account you agree to these rules. They keep campus spaces safe and useful."
            meta={[`Updated ${UPDATED}`, "Follows the IT Rules, 2021"]}
          />
        }
      >
        <DocSummary
          items={[
            "Students join with a college email. Anyone else can use Campus Preview.",
            "One person, one account. No bots, no fake profiles.",
            "No ragging, harassment, doxxing, adult content or exam leaks.",
            "Posts with three reports are hidden until a person reviews them, within 24 hours.",
            "Complaints go to our Grievance Officer: grievance@campusloop.space.",
          ]}
        />

        <DocSection id="eligibility" title="Who can join">
          <p>
            Students at Indian colleges join with their college email and get a verified tick. Anyone else can
            sign up with another email and use Campus Preview.
          </p>
          <DocTable
            rows={[
              {
                label: "Verified student",
                value: "Full access",
                note: "Post, share notes, comment, vote, chat and, if 18 or older, use Campus Match.",
              },
              {
                label: "Campus Preview",
                value: "Most features, no verified tick",
                note: "Browse college pages, feeds and study material, and join open spaces. Verified-only spaces open once you verify a college email.",
              },
              {
                label: "Faculty and alumni",
                value: "No separate role",
                note: "CampusLoop is for current students. Without a current college email, use Campus Preview.",
              },
              {
                label: "Campus Match and Secret Crush",
                value: "18 and above",
                note: "Only for verified students who are 18 or older.",
              },
            ]}
          />
        </DocSection>

        <DocSection id="account" title="Your account">
          <p>One student, one account. You are responsible for what happens on your account.</p>
          <DocList
            items={[
              "Don't run bot accounts, scrape student lists or fake verification links.",
              "Don't pretend to be another student, teacher, college staff member or club.",
              "Don't try to get into other people's accounts or other college spaces.",
            ]}
          />
        </DocSection>

        <DocSection id="prohibited" title="What you can't post">
          <p>
            Under Rule 3(1)(b) of the Information Technology (Intermediary Guidelines and Digital Media Ethics
            Code) Rules, 2021, you may not post content that:
          </p>
          <DocList
            items={[
              "Shares someone's private details (doxxing), such as hostel room numbers, phone numbers or roll numbers.",
              "Bullies, harasses, threatens or defames anyone, or spreads hate against any group.",
              "Is sexually explicit, or shares intimate media without consent (Sections 67 and 67A of the IT Act).",
              "Helps with exam cheating, paper leaks or academic fraud.",
              "Involves minors in any sexual or exploitative way. We report this to the police right away.",
            ]}
          />
        </DocSection>

        <DocSection id="anonymity" title="Anonymous posts">
          <p>
            Anonymous posting exists so you can raise real problems about hostels, classes or mental health
            without fear.
          </p>
          <p>
            Anonymous posts never show your name or profile to anyone on CampusLoop, including classmates,
            seniors, faculty and college staff. Your identity is encrypted separately. CampusLoop can only
            recover it for a lawful order or a serious safety report, and every such access is logged.
          </p>
          <DocNote>
            Anonymity is not a cover for harassment. Accounts that target others anonymously are suspended,
            and identities are disclosed when a competent authority orders it.
          </DocNote>
        </DocSection>

        <DocSection id="moderation" title="Reports and removal">
          <p>
            A post with three separate reports is hidden from the campus feed until a moderator reviews it,
            within 24 hours.
          </p>
          <p>If we remove your post, we tell you which rule it broke. You can appeal to the safety desk.</p>
        </DocSection>

        <DocSection id="termination" title="Suspension">
          <p>
            We may suspend or remove accounts that break these terms. Serious offences such as ragging,
            threats of violence or sexual harassment lead to permanent removal and a report to the
            college&apos;s disciplinary committee.
          </p>
          <p>
            You can ask us to delete your account any time by emailing{" "}
            <MailLink email="privacy@campusloop.space" />.
          </p>
        </DocSection>

        <DocSection id="grievance" title="Grievance Officer">
          <p>
            Appointed under Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media
            Ethics Code) Rules, 2021.
          </p>
          <DocTable
            rows={[
              { label: "Grievance Officer", value: "Shaswat Raj" },
              { label: "Email", value: <MailLink email="grievance@campusloop.space" /> },
              { label: "We reply", value: "Within 24 hours of receiving your complaint" },
              { label: "We resolve", value: "Within 15 days, as the IT Rules, 2021 require" },
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

import Link from "next/link";
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
    "Who can join CampusLoop, what members and verified students can do, what you can't post, how reports and bans work, and how to reach our Grievance Officer.",
  path: "/terms",
});

const UPDATED = "26 November 2026";

const SECTIONS: DocSectionRef[] = [
  { id: "eligibility", label: "Who can join" },
  { id: "account", label: "Your account" },
  { id: "prohibited", label: "What you can't post" },
  { id: "anonymity", label: "Anonymous posts" },
  { id: "moderation", label: "Reports and removal" },
  { id: "play", label: "Play and DP Battle" },
  { id: "emails", label: "Emails we send" },
  { id: "apps", label: "Connected apps" },
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
            dateModified: "2026-11-26",
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
            "Anyone can join. You pick your college and join it as a member.",
            "Verify with a college email or the GitHub Student Developer Pack to get the verified badge.",
            "Our admins decide what members can do. Some features are for verified students only.",
            "One person, one account. No bots, no fake profiles.",
            "No ragging, harassment, doxxing, adult content or exam leaks.",
            "Posts with three reports are hidden until a person reviews them, within 24 hours.",
            "Complaints go to our Grievance Officer: grievance@campusloop.space.",
          ]}
        />

        <DocSection id="eligibility" title="Who can join">
          <p>
            Anyone can make an account, with a college email or a personal one like Gmail. You pick your
            college and join its campus as a member. Students who prove they study there get a verified
            badge next to their name.
          </p>
          <DocTable
            rows={[
              {
                label: "Verified student",
                value: "Everything, with the verified badge",
                note: "Verify with your college email, or with the GitHub Student Developer Pack if you have no college email. Our team can also verify you by hand.",
              },
              {
                label: "Member",
                value: "Most features, no badge",
                note: "Members can post, comment, vote, chat, join communities, register for events, upload, post stories and play games. By default they can't post anonymously, use Campus Match or Secret Crush, or create communities or events.",
              },
              {
                label: "Campus Preview",
                value: "Look around",
                note: "If you haven't picked a college yet, you can browse public pages, feeds and study material.",
              },
              {
                label: "Campus Match and Secret Crush",
                value: "18 and above",
                note: "Only for verified students who are 18 or older.",
              },
            ]}
          />
          <p>
            Our admins can change what members are allowed to do at any time. A member&apos;s first few posts
            may wait for a quick review before they show up, and members have tighter limits on how much they
            can post or message in an hour. This keeps spam and fake accounts out.
          </p>
        </DocSection>

        <DocSection id="account" title="Your account">
          <p>One person, one account. You are responsible for what happens on your account.</p>
          <DocList
            items={[
              "Don't run bot accounts, scrape student lists or fake verification links.",
              "Don't pretend to be another student, teacher, college staff member or club.",
              "Don't verify with an email or GitHub account that isn't yours. One GitHub account can verify only one profile.",
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

        <DocSection id="play" title="Play and DP Battle">
          <p>
            Play has games like DP Battle, Meme War, trivia, This or That and Branch Wars. You earn badges and
            Loop Points. Points have no money value and can&apos;t be sold or swapped for cash.
          </p>
          <DocList
            items={[
              "DP Battle is opt-in. If you enter, your current profile photo is shown to students at your college, who vote between two photos. You can leave any time.",
              "Only enter with a photo of yourself. Don't use someone else's photo.",
              "Memes and photos follow the same rules as posts. Reported entries can be hidden.",
              "Don't use extra accounts or scripts to win votes. We can remove points, badges and entries that were gamed.",
            ]}
          />
        </DocSection>

        <DocSection id="emails" title="Emails we send">
          <p>
            We send emails you need for your account, like sign-in and verification links and security
            notices. You can&apos;t turn these off while you have an account.
          </p>
          <p>
            We also send some product emails, like a welcome note, verification reminders, new feature news,
            event digests and news about our Android app. Every one of these has an unsubscribe link. One tap
            stops them. It doesn&apos;t stop account or security emails.
          </p>
        </DocSection>

        <DocSection id="apps" title="Connected apps">
          <p>
            Developers can build apps that connect to CampusLoop through our{" "}
            <Link
              href="/developers"
              className="font-medium text-brand-text underline underline-offset-4 hover:no-underline"
            >
              developer platform
            </Link>
            . An app only gets the access you approve on the sign-in screen. You can remove an app any time in
            Settings, under Connected apps.
          </p>
          <p>
            Apps are run by their own developers, not by us. Developers must follow these terms and must not
            misuse student data. We can turn off any app that breaks them.
          </p>
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

import {
  DocLayout,
  DocList,
  DocNote,
  DocSection,
  type DocSectionRef,
  DocSummary,
  DocTable,
  LegalDocHeader,
} from "@/components/marketing/legal-doc";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { breadcrumbJsonLd, buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { Helplines } from "./helplines";

export const metadata = buildMetadata({
  title: "Safety",
  description:
    "CampusLoop's community rules, zero-tolerance ragging policy, how reporting works, and free emergency helplines for students in India.",
  path: "/safety",
});

const SECTIONS: DocSectionRef[] = [
  { id: "helplines", label: "Emergency helplines" },
  { id: "standards", label: "Community rules" },
  { id: "ragging", label: "Ragging" },
  { id: "doxxing", label: "Personal details" },
  { id: "moderation", label: "Reporting" },
  { id: "match", label: "Campus Match safety" },
];

export default function SafetyPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={[
          {
            "@type": "WebPage",
            name: "CampusLoop Safety",
            url: `${SITE_URL}/safety`,
            inLanguage: "en-IN",
            dateModified: "2026-11-02",
            publisher: { "@id": `${SITE_URL}/#organization` },
          },
          breadcrumbJsonLd([{ name: "Safety", path: "/safety" }]),
        ]}
      />
      <DocLayout
        sections={SECTIONS}
        header={
          <LegalDocHeader
            title="Safety"
            summary="How we keep CampusLoop safe, and who to call if you or a friend need help right now."
            meta={["Updated 2 November 2026", "Follows the UGC Anti-Ragging Regulations, 2009"]}
          />
        }
      >
        <DocSection id="helplines" title="Need help right now?">
          <p>
            If you or a classmate is in danger or distress, call a helpline first. These are free and
            confidential.
          </p>
          <Helplines />
        </DocSection>

        <DocSummary
          items={[
            "Ragging, threats and harassment get you banned for good.",
            "Phone numbers, room numbers and roll numbers are filtered out of posts.",
            "Three reports hide a post until a person reviews it.",
            "Campus Match is only for verified students aged 18 and above.",
          ]}
        />

        <DocSection id="standards" title="Community rules">
          <p>
            Every verified profile is tied to a college email, so what you do here counts. Treat it like your
            hostel common room.
          </p>
          <DocList
            items={[
              "Post under your name or your anonymous handle. Never pretend to be someone else.",
              "Disagree with ideas, not people. No personal attacks or pile-ons.",
              "Don't post photos or private chats of others without their consent.",
              "Threats, blackmail or pressure are hidden as soon as they are reported.",
            ]}
          />
        </DocSection>

        <DocSection id="ragging" title="Zero tolerance for ragging">
          <p>
            Under the{" "}
            <strong className="font-semibold text-fg">
              UGC Regulations on Curbing the Menace of Ragging in Higher Educational Institutions, 2009
            </strong>
            , online ragging is treated like ragging in person. This includes scaring juniors, forcing tasks
            on them, humiliating them or threatening them in groups or chats.
          </p>
          <DocNote>
            Proven ragging means a permanent ban, losing all Loop Points, and a report to your college&apos;s
            Anti-Ragging Committee and, where needed, the police.
          </DocNote>
        </DocSection>

        <DocSection id="doxxing" title="Personal details">
          <p>Sharing where someone lives on campus can put them in real danger. Our filters flag and hide:</p>
          <DocList
            items={[
              "Personal phone numbers and unknown chat invite links.",
              "Hostel block and room numbers, and student roll numbers.",
              "Personal emails posted to target someone.",
              "Photos or videos from inside hostel rooms shared without consent.",
            ]}
          />
        </DocSection>

        <DocSection id="moderation" title="Reporting">
          <p>Every post, story, confession and comment has a Report option. People review every report.</p>
          <DocTable
            rows={[
              {
                label: "Hidden",
                value: "After three separate reports",
                note: "The post leaves campus feeds while we review it.",
              },
              {
                label: "Reviewed",
                value: "Within 24 hours, safety reports within 12",
                note: "Serious safety reports skip the queue.",
              },
              {
                label: "Action",
                value: "Warning, timeout or permanent ban",
                note: "Every action is logged.",
              },
            ]}
          />
        </DocSection>

        <DocSection id="match" title="Campus Match and Secret Crush">
          <p>Only for verified students aged 18 and above. Nobody learns about one-sided interest.</p>
          <DocList
            items={[
              <>
                <strong className="font-semibold text-fg">Secret Crush stays secret</strong> unless you both
                add each other.
              </>,
              <>
                <strong className="font-semibold text-fg">Block any time.</strong> Blocking removes the chat
                and hides you from each other.
              </>,
              <>
                <strong className="font-semibold text-fg">Meet safely.</strong> Meet in a public place on
                campus and tell a friend.
              </>,
            ]}
          />
        </DocSection>
      </DocLayout>
    </MarketingShell>
  );
}

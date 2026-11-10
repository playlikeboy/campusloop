import { Phone } from "lucide-react";
import Link from "next/link";
import {
  DocLayout,
  DocSection,
  type DocSectionRef,
  DocTable,
  LegalDocHeader,
  MailLink,
} from "@/components/marketing/legal-doc";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { buttonVariants } from "@/components/ui/button";
import { breadcrumbJsonLd, buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { ContactDesks } from "./contact-client";

export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Email CampusLoop for app help, safety, privacy requests, adding your college, or press. Our Grievance Officer's details are here too.",
  path: "/contact",
});

const SECTIONS: DocSectionRef[] = [
  { id: "desks", label: "Who to email" },
  { id: "urgent", label: "Urgent help" },
  { id: "college", label: "Add your college" },
  { id: "legal", label: "Grievance Officer" },
];

export default function ContactPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={[
          {
            "@type": "ContactPage",
            name: "Contact CampusLoop",
            url: `${SITE_URL}/contact`,
            about: { "@id": `${SITE_URL}/#organization` },
            mainEntity: {
              "@type": "Organization",
              "@id": `${SITE_URL}/#organization`,
              contactPoint: [
                {
                  "@type": "ContactPoint",
                  email: "support@campusloop.space",
                  contactType: "customer support",
                  areaServed: "IN",
                  availableLanguage: ["en", "hi"],
                },
                {
                  "@type": "ContactPoint",
                  email: "grievance@campusloop.space",
                  contactType: "grievance redressal",
                  areaServed: "IN",
                },
              ],
            },
          },
          breadcrumbJsonLd([{ name: "Contact", path: "/contact" }]),
        ]}
      />
      <DocLayout
        sections={SECTIONS}
        header={
          <LegalDocHeader
            title="Contact us"
            summary="A real person reads every email. Pick the right address below and we'll get back to you."
            meta={["English or Hindi"]}
          />
        }
      >
        <DocSection id="desks" title="Who to email">
          <ContactDesks />
        </DocSection>

        <DocSection id="urgent" title="Urgent help">
          <p>
            If someone is in danger, call the National Anti-Ragging Helpline (24x7, free) before emailing us.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="tel:18001805522" className={buttonVariants({ variant: "danger" })}>
              <Phone aria-hidden="true" />
              Call 1800-180-5522
            </a>
            <Link href="/safety#helplines" className={buttonVariants({ variant: "outline" })}>
              See all helplines
            </Link>
          </div>
          <p>
            To report a post, comment or confession, tap Report on it. It goes straight to our moderators.
          </p>
        </DocSection>

        <DocSection id="college" title="Add your college">
          <p>
            Can&apos;t sign up because your college isn&apos;t listed? Send us its email domain. We usually
            add it within a day.
          </p>
          <Link href="/college-request" className={buttonVariants({ variant: "primary" })}>
            Request your college
          </Link>
        </DocSection>

        <DocSection id="legal" title="Grievance Officer">
          <p>
            Published under Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media
            Ethics Code) Rules, 2021, and built to follow India&apos;s DPDP Act, 2023.
          </p>
          <DocTable
            rows={[
              {
                label: "Grievance Officer",
                value: (
                  <>
                    Shaswat Raj, <MailLink email="grievance@campusloop.space" />
                  </>
                ),
                note: "We reply within 24 hours and resolve within 15 days.",
              },
              {
                label: "Privacy requests",
                value: <MailLink email="privacy@campusloop.space" />,
                note: "We reply within 48 working hours.",
              },
              {
                label: "Legal entity",
                value: "CampusLoop (not yet incorporated)",
                note: "Run from India by founder Shaswat Raj.",
              },
            ]}
          />
        </DocSection>
      </DocLayout>
    </MarketingShell>
  );
}

import { PageIntro } from "@/components/marketing/page-hero";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { buildMetadata } from "@/lib/seo";
import { CollegeRequestClient } from "./request-client";

export const metadata = buildMetadata({
  title: "Request your college",
  description:
    "Can't find your college on CampusLoop? Send us its name and student email domain and we'll add it.",
  path: "/college-request",
  noindex: true,
});

export default function CollegeRequestPage() {
  return (
    <MarketingShell>
      <div className="mx-auto w-full max-w-xl px-[var(--gutter)] py-12 sm:py-16">
        <PageIntro
          title="Is your college missing?"
          lede="Tell us its student email domain and we'll add it, usually within a day."
          className="mb-8"
        />
        <CollegeRequestClient />
      </div>
    </MarketingShell>
  );
}

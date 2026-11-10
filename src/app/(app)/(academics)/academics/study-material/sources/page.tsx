import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AcademicSourcesDirectory } from "@/components/academics/academic-sources-directory";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/seo/constants";
import { JsonLd } from "@/lib/seo/json-ld-script";

export const metadata = buildMetadata({
  title: "Websites for notes and PYQs",
  description:
    "A list of working university and student websites with free engineering notes, past papers and lab manuals.",
  path: "/academics/study-material/sources",
  keywords: [
    "websites for engineering notes",
    "college PYQ websites",
    "AKTU notes website",
    "VTU notes and question papers",
    "free college notes PDF sites",
  ],
});

export default function AcademicSourcesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-12 lg:px-6">
      <JsonLd
        data={[
          {
            "@type": "CollectionPage",
            name: "Websites for notes and PYQs",
            url: absoluteUrl("/academics/study-material/sources"),
            inLanguage: "en-IN",
          },
          breadcrumbJsonLd([
            { name: "Study material", path: "/academics" },
            { name: "Websites for notes and PYQs", path: "/academics/study-material/sources" },
          ]),
        ]}
      />
      <Link
        href="/academics"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-fg-muted transition-ui hover:text-fg"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Study material
      </Link>
      <AcademicSourcesDirectory />
    </div>
  );
}

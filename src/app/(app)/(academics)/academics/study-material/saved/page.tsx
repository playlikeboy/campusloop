import type { Metadata } from "next";
import { Suspense } from "react";
import { SavedMaterialsClient } from "./saved-materials-client";

export const metadata: Metadata = {
  title: "Semester Study Locker & Saved Materials",
  description:
    "Your personalized cloud academic locker. Access all your saved semester notes, PYQs, formula sheets, and lab manuals organized by subject and semester without downloading files.",
  keywords: [
    "Academic Locker",
    "Saved College Notes",
    "Semester Study Materials",
    "Direct PDF Reader",
    "B.Tech Notes Cloud",
  ],
  alternates: { canonical: "https://campusloop.space/academics/study-material/saved" },
  openGraph: {
    title: "Semester Study Locker",
    description: "Access your saved engineering notes & PYQs anywhere without filling phone storage.",
    url: "https://campusloop.space/academics/study-material/saved",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [
      { url: "https://campusloop.space/og-academics.png", width: 1536, height: 1024, alt: "Semester Locker" },
    ],
  },
  robots: { index: false, follow: false },
};

export default function SavedAcademicsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Semester Academic Study Locker",
    url: "https://campusloop.space/academics/study-material/saved",
    description: "Student cloud academic resource locker and syllabus organizer.",
    publisher: {
      "@type": "Organization",
      name: "CampusLoop",
      url: "https://campusloop.space",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Suspense
        fallback={
          <div className="flex h-[60vh] w-full items-center justify-center">
            <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <SavedMaterialsClient />
      </Suspense>
    </>
  );
}

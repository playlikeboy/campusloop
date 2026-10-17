import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { AcademicsClient } from "./study-material/academics-client";

export const metadata: Metadata = {
  title: "Academic Notes, PYQs & Cheat Sheets | Free Engineering PDF Download | CampusLoop",
  description:
    "Find college notes, previous-year questions (PYQs), formula sheets and lab manuals by subject, branch and semester, with source links and community feedback to help you choose useful study materials.",
  keywords: [
    "Free College Notes PDF",
    "B.Tech Semester Notes",
    "Previous Year Question Papers PYQ",
    "Engineering Cheat Sheets",
    "AKTU Quantum Series PDF",
    "VTU Notes PDF",
    "BIT Mesra Academics",
    "Data Structures Algorithms PYQ",
    "Operating Systems Notes",
    "DBMS Handwritten Notes",
    "Computer Networks Question Papers",
    "AICTE Model Curriculum Notes",
    "Lab Manuals Engineering",
    "Free PDF Download Zero Login",
    "Semester Exam Preparation",
  ],
  alternates: { canonical: "https://campusloop.space/academics" },
  openGraph: {
    title: "Academic Notes, PYQs & Cheat Sheets | CampusLoop Study Vault",
    description:
      "Discover course notes, previous-year questions, formula sheets and lab manuals from campus contributors and public education sources.",
    url: "https://campusloop.space/academics",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://campusloop.space/og-academics.png",
        width: 1536,
        height: 1024,
        alt: "CampusLoop Academics — Verified Study Vault",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusLoop Academics — Verified Study Vault for College Students",
    description:
      "Free verified engineering & university course notes, semester-wise PYQs, cheat sheets, and practical lab manuals across 1,350+ campuses in India.",
    images: ["https://campusloop.space/og-academics.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

interface AcademicsPageProps {
  searchParams?: Promise<{ id?: string }>;
}

export default async function AcademicsPage({ searchParams }: AcademicsPageProps) {
  const user = await getCachedAuthUser();
  const profile = user ? await getCachedUserProfile(user.id) : null;

  const resolvedParams = searchParams ? await searchParams : undefined;
  if (resolvedParams?.id) {
    redirect(`/academics/study-material/${resolvedParams.id}`);
  }

  // Schema.org Structured Data for Google & Bing SERP
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "CampusLoop Academic Study Vault & PYQs",
    description:
      "A searchable collection of college notes, previous-year questions, formula sheets and lab manuals from campus contributors and public education sources.",
    url: "https://campusloop.space/academics",
    inLanguage: "en-IN",
    mainEntity: {
      "@type": "ItemList",
      name: "Featured Engineering Subjects & Study Materials",
      numberOfItems: 6,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Data Structures & Algorithms (DSA)",
          url: "https://campusloop.space/academics?q=CS201",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Operating Systems (OS)",
          url: "https://campusloop.space/academics?q=CS303",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Database Management Systems (DBMS)",
          url: "https://campusloop.space/academics?q=CS302",
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Computer Networks (CN)",
          url: "https://campusloop.space/academics?q=CS401",
        },
        {
          "@type": "ListItem",
          position: 5,
          name: "Engineering Mathematics & Calculus",
          url: "https://campusloop.space/academics?q=MA101",
        },
        {
          "@type": "ListItem",
          position: 6,
          name: "AKTU Quantum Series & Exam Banks",
          url: "https://campusloop.space/academics?branch=Computer+Science",
        },
      ],
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How can I download engineering notes and PYQ papers for free on CampusLoop?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Many public study resources can be opened without signing in. A guest download limit applies; signing in unlocks unlimited downloads and a personal study vault.",
        },
      },
      {
        "@type": "Question",
        name: "Which universities and engineering colleges are covered?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "CampusLoop aggregates syllabus-aligned academic study materials across 1,350+ Indian colleges and universities, including BIT Mesra, AKTU Lucknow, VTU Belagavi, JNTU Hyderabad, MAKAUT West Bengal, SRM University, and AICTE model curricula.",
        },
      },
      {
        "@type": "Question",
        name: "Are the study materials and question papers verified?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "CampusLoop displays verification and community helpfulness signals where available, but these badges do not guarantee that every file is accurate or syllabus-aligned. Check the linked source or your course outline, and report broken or misleading materials.",
        },
      },
      {
        "@type": "Question",
        name: "How does the personalized study recommendation algorithm work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "CampusLoop's academic feed personalizes notes and PYQs dynamically based on your college syllabus, branch, current semester, learning affinity, and curriculum corequisites with rotating discovery.",
        },
      },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://campusloop.space",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Academics",
        item: "https://campusloop.space/academics",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <AcademicsClient
        profileId={profile?.id ?? null}
        collegeName={profile?.institution?.name || "Campus Hub"}
        userBranch={profile?.branch || "Computer Science"}
        userSemester={profile?.year ? Math.min(8, Math.max(1, profile.year * 2 - 1)) : 5}
      />
    </>
  );
}

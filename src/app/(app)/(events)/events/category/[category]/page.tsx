import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryEventsClient } from "./category-events-client";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

const CATEGORY_MAP: Record<
  string,
  {
    title: string;
    headline: string;
    description: string;
    keywords: string[];
    canonicalCategory: string;
  }
> = {
  hackathons: {
    title: "College Hackathons 2026 | Coding Sprints & Cash Prizes in India",
    headline: "College Hackathons & Builds",
    description: "Browse verified hackathons, coding sprints, AI builds, and developer competitions across top Indian universities with live cash prizes and recruiter bounties.",
    keywords: ["college hackathons India", "coding sprint", "AI hackathon", "student developer competitions"],
    canonicalCategory: "hackathons",
  },
  workshops: {
    title: "Campus Tech & Creative Workshops | Hands-On Bootcamps",
    headline: "Hands-on Workshops & Bootcamps",
    description: "Explore student and club-led workshops in Web3, AI, Cloud, design, and robotics hosted across college hubs in India.",
    keywords: ["college workshops", "tech bootcamp", "student workshops", "campus skill building"],
    canonicalCategory: "workshops",
  },
  fests: {
    title: "College Fests 2026 | Tech, Cultural & Sports Expos in India",
    headline: "Annual College Fests & Expos",
    description: "Discover upcoming annual cultural nights, technical fests, concert passes, and campus expos across 1,350+ Indian colleges.",
    keywords: ["college fests India", "cultural fest", "tech fest", "university concert passes"],
    canonicalCategory: "fests",
  },
  competitions: {
    title: "Student Competitions & Case Battles | Campus Challenges",
    headline: "Competitions, Quizzes & Debates",
    description: "Compete in case study challenges, business model wars, debate circuits, and student quizzes hosted by university societies.",
    keywords: ["case study competition", "college quiz", "student debate", "business competition"],
    canonicalCategory: "competitions",
  },
  seminars: {
    title: "Academic Seminars & Guest Talks | Campus Keynotes",
    headline: "Seminars, Talks & Conferences",
    description: "Attend insightful guest lectures, academic research symposiums, and tech keynote talks on CampusLoop.",
    keywords: ["academic seminar", "college guest talk", "university symposium", "alumni keynote"],
    canonicalCategory: "seminars",
  },
  gaming: {
    title: "College Esports Tournaments & Gaming LANs | India",
    headline: "Gaming & Esports Tournaments",
    description: "Join competitive gaming LANs, Valorant & BGMI campus showdowns, and console esports tournaments with student prize pools.",
    keywords: ["college esports India", "campus gaming tournament", "student LAN", "university BGMI"],
    canonicalCategory: "gaming",
  },
  meetups: {
    title: "Campus Tech Meetups & Open Source Gatherings",
    headline: "Developer Meetups & Jam Sessions",
    description: "Connect with builders, join weekend hack sessions, and network with tech leaders at offline and online campus meetups.",
    keywords: ["college tech meetup", "student developer group", "campus networking"],
    canonicalCategory: "meetups",
  },
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const config = CATEGORY_MAP[category.toLowerCase()];

  if (!config) {
    return { title: "Campus Opportunities | CampusLoop" };
  }

  const canonical = `https://campusloop.space/events/category/${category.toLowerCase()}`;
  return {
    title: `${config.title} — CampusLoop`,
    description: config.description,
    alternates: { canonical },
    keywords: config.keywords,
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      title: config.title,
      description: config.description,
      url: canonical,
      images: [{ url: "https://campusloop.space/og-image.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
      images: ["https://campusloop.space/og-image.png"],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const config = CATEGORY_MAP[category.toLowerCase()];

  if (!config) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: config.title,
    description: config.description,
    url: `https://campusloop.space/events/category/${category.toLowerCase()}`,
    publisher: {
      "@type": "Organization",
      name: "CampusLoop",
      url: "https://campusloop.space",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryEventsClient
        category={category.toLowerCase()}
        config={config}
      />
    </>
  );
}

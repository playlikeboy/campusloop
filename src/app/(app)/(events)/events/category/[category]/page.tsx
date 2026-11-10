import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { CategoryEventsClient } from "./category-events-client";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

type CategoryConfig = {
  title: string;
  headline: string;
  description: string;
};

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  hackathons: {
    title: "College hackathons",
    headline: "Hackathons",
    description:
      "Hackathons and coding contests at colleges across India. See dates, team size and how to register.",
  },
  workshops: {
    title: "College workshops",
    headline: "Workshops",
    description:
      "Hands-on workshops run by college clubs, from coding and design to robotics. Find one near you.",
  },
  fests: {
    title: "College fests",
    headline: "Fests",
    description:
      "Cultural, tech and sports fests at colleges across India. See what is coming up and get your pass.",
  },
  competitions: {
    title: "Student competitions",
    headline: "Competitions",
    description:
      "Case studies, quizzes and debates run by college societies. Find one and sign up solo or as a team.",
  },
  seminars: {
    title: "Talks and seminars",
    headline: "Talks and seminars",
    description:
      "Guest lectures, alumni talks and seminars at colleges on CampusLoop. Check the date and save a seat.",
  },
  gaming: {
    title: "College gaming tournaments",
    headline: "Gaming tournaments",
    description:
      "Campus esports and LAN tournaments for games like Valorant, BGMI and chess. Find one and join.",
  },
  meetups: {
    title: "Campus meetups",
    headline: "Meetups",
    description:
      "Club meetups, build nights and open-source sessions at colleges. Drop in, meet people, build stuff.",
  },
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const key = category.toLowerCase();
  const config = CATEGORY_MAP[key];
  if (!config) return { title: "Events", robots: { index: false, follow: false } };

  return buildMetadata({
    title: config.title,
    description: config.description,
    path: `/events/category/${key}`,
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const key = category.toLowerCase();
  const config = CATEGORY_MAP[key];
  if (!config) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Events", path: "/events" },
          { name: config.headline, path: `/events/category/${key}` },
        ])}
      />
      <CategoryEventsClient category={key} config={config} />
    </>
  );
}

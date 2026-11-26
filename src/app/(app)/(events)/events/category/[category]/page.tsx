import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { InitialEvents } from "../../initial-events";
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
      "Hackathons and coding contests at colleges across India. See dates, team size, prizes and whether it is online or on campus, then register in a tap.",
  },
  workshops: {
    title: "College workshops",
    headline: "Workshops",
    description:
      "Hands-on workshops run by college clubs, from coding and design to robotics and finance. See the date, venue and fee, and book a seat on CampusLoop.",
  },
  fests: {
    title: "College fests",
    headline: "Fests",
    description:
      "Cultural, tech and sports fests at colleges across India. See what is coming up, the dates and venue, and get your pass on CampusLoop before it fills.",
  },
  competitions: {
    title: "Student competitions",
    headline: "Competitions",
    description:
      "Case studies, quizzes, debates and business plan contests run by college societies. Check the prizes and deadline, then sign up solo or as a team.",
  },
  seminars: {
    title: "Talks and seminars",
    headline: "Talks and seminars",
    description:
      "Guest lectures, alumni talks and seminars at colleges on CampusLoop. See who is speaking, the date and venue, and save a seat before it fills up.",
  },
  gaming: {
    title: "College gaming tournaments",
    headline: "Gaming tournaments",
    description:
      "Campus esports and LAN tournaments for games like Valorant, BGMI, chess and FIFA. See the format, entry fee and prizes, and register your squad.",
  },
  meetups: {
    title: "Campus meetups",
    headline: "Meetups",
    description:
      "Club meetups, build nights and open-source sessions at colleges near you. See when and where they happen, drop in, meet people and build something.",
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
      <InitialEvents query={`category=${encodeURIComponent(key)}`}>
        <CategoryEventsClient category={key} config={config} />
      </InitialEvents>
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const PILLARS = [
  {
    title: "Academics",
    description: "Resources built by students.",
    detail: "Peer-reviewed lecture notes, previous year question papers, and study guides.",
    image: "/campusloop/marketing/voxel/academics.webp",
    alt: "Voxel 3D campus library with study desks, bookshelves, and student laptops",
    href: "/academics",
    tag: "Vault",
  },
  {
    title: "Communities",
    description: "Find clubs and people.",
    detail: "Student societies, hackathon squads, interest groups, and campus channels.",
    image: "/campusloop/marketing/voxel/communities.webp",
    alt: "Voxel 3D campus club fair with student booths and banners",
    href: "/communities",
    tag: "Clubs",
  },
  {
    title: "Events",
    description: "See what's happening around campus.",
    detail: "Workshops, fests, hackathons, guest lectures, and campus meetups.",
    image: "/campusloop/marketing/voxel/events.webp",
    alt: "Voxel 3D campus festival with live stage, lights, and students",
    href: "/events",
    tag: "Calendar",
  },
  {
    title: "Colleges",
    description: "Explore colleges and universities.",
    detail: "Discover indexed campus hubs, student cultures, and national connections.",
    image: "/campusloop/marketing/voxel/colleges.webp",
    alt: "Voxel 3D collegiate gateway and university campus",
    href: "/colleges",
    tag: "Directory",
  },
];

export function VoxelPillars() {
  return (
    <section className="py-14 sm:py-20 lg:py-24 border-t border-border/40 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            What CampusLoop brings together
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Four pillars of your campus.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Everything your college needs in one cohesive student network.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar) => (
            <Link
              key={pillar.title}
              href={pillar.href}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-3 shadow-xs hover:border-primary/40 hover:shadow-md transition-all"
            >
              {/* Voxel Image */}
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-muted/40">
                <Image
                  src={pillar.image}
                  alt={pillar.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute top-2.5 right-2.5 rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-white">
                  {pillar.tag}
                </span>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col justify-between pt-4 pb-2 px-1">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {pillar.title}
                    </h3>
                    <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <p className="mt-1 text-xs font-medium text-foreground/80">
                    {pillar.description}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-normal line-clamp-2">
                    {pillar.detail}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

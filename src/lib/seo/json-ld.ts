import { SOCIAL_SAME_AS } from "@/constants/social";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./constants";

/**
 * Schema.org JSON-LD builders. Each returns a plain object (no @context) so
 * several can be combined with `graphJsonLd()`. Render with:
 *
 *   <script type="application/ld+json"
 *     dangerouslySetInnerHTML={{ __html: serializeJsonLd(graphJsonLd(a, b)) }} />
 *
 * Only state facts the page really shows. Never add ratings, review counts,
 * prices or student counts that are not in the database.
 */

type Thing = Record<string, unknown>;

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/** Removes undefined/null/empty-array keys so the output stays clean. */
function compact<T extends Thing>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0)
    )
  ) as T;
}

export function organizationJsonLd(): Thing {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    description: SITE_DESCRIPTION,
    areaServed: { "@type": "Country", name: "India" },
    sameAs: SOCIAL_SAME_AS,
  };
}

/** WebSite with a SearchAction pointing at /explore?q=. */
export function websiteJsonLd(): Thing {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    alternateName: "Campus Loop",
    url: SITE_URL,
    inLanguage: "en-IN",
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/explore?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Breadcrumbs from root to the current page, e.g. [{name:"Colleges",path:"/colleges"},{name:"IIT Delhi",path:"/college/iit-delhi"}]. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]): Thing {
  const trail = [{ name: "Home", path: "/" }, ...items];
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function collegeJsonLd(input: {
  name: string;
  /** CampusLoop page for the college, e.g. "/college/iit-delhi". */
  path: string;
  /** The college's own website, if known. */
  website?: string | null;
  city?: string | null;
  state?: string | null;
  logo?: string | null;
  alternateName?: string | null;
}): Thing {
  const address =
    input.city || input.state
      ? compact({
          "@type": "PostalAddress",
          addressLocality: input.city ?? undefined,
          addressRegion: input.state ?? undefined,
          addressCountry: "IN",
        })
      : undefined;
  return compact({
    "@type": "CollegeOrUniversity",
    "@id": `${absoluteUrl(input.path)}#college`,
    name: input.name,
    alternateName: input.alternateName ?? undefined,
    url: input.website || absoluteUrl(input.path),
    mainEntityOfPage: absoluteUrl(input.path),
    logo: input.logo ?? undefined,
    address,
    sameAs: input.website ? [input.website] : undefined,
  });
}

export function articleJsonLd(input: {
  headline: string;
  description?: string | null;
  path: string;
  image?: string | null;
  datePublished: Date | string;
  dateModified?: Date | string | null;
  authorName: string;
  /** Public profile path of the author, if they have one. */
  authorPath?: string | null;
  /** "Article" for long-form, "DiscussionForumPosting" for feed posts. */
  type?: "Article" | "BlogPosting" | "DiscussionForumPosting";
}): Thing {
  const iso = (d: Date | string) => (typeof d === "string" ? d : d.toISOString());
  return compact({
    "@type": input.type ?? "Article",
    headline: input.headline.slice(0, 110),
    description: input.description ?? undefined,
    url: absoluteUrl(input.path),
    mainEntityOfPage: absoluteUrl(input.path),
    image: input.image ? [absoluteUrl(input.image)] : undefined,
    datePublished: iso(input.datePublished),
    dateModified: iso(input.dateModified ?? input.datePublished),
    author: compact({
      "@type": "Person",
      name: input.authorName,
      url: input.authorPath ? absoluteUrl(input.authorPath) : undefined,
    }),
    publisher: { "@id": ORG_ID },
    inLanguage: "en-IN",
  });
}

export function eventJsonLd(input: {
  name: string;
  description?: string | null;
  path: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  image?: string | null;
  /** Venue name and optional address. Leave out for online-only events. */
  venue?: { name: string; address?: string | null } | null;
  online?: boolean;
  organizerName?: string | null;
  status?: "scheduled" | "cancelled" | "postponed";
  /** Only when tickets really have a price. 0 for free registration. */
  price?: number | null;
}): Thing {
  const iso = (d: Date | string) => (typeof d === "string" ? d : d.toISOString());
  const url = absoluteUrl(input.path);
  const mode =
    input.online && input.venue
      ? "MixedEventAttendanceMode"
      : input.online
        ? "OnlineEventAttendanceMode"
        : "OfflineEventAttendanceMode";
  const statusMap = {
    scheduled: "EventScheduled",
    cancelled: "EventCancelled",
    postponed: "EventPostponed",
  } as const;

  const locations: Thing[] = [];
  if (input.venue) {
    locations.push(
      compact({
        "@type": "Place",
        name: input.venue.name,
        address: input.venue.address
          ? { "@type": "PostalAddress", streetAddress: input.venue.address, addressCountry: "IN" }
          : undefined,
      })
    );
  }
  if (input.online) locations.push({ "@type": "VirtualLocation", url });

  return compact({
    "@type": "Event",
    name: input.name,
    description: input.description ?? undefined,
    url,
    image: input.image ? [absoluteUrl(input.image)] : undefined,
    startDate: iso(input.startDate),
    endDate: input.endDate ? iso(input.endDate) : undefined,
    eventStatus: `https://schema.org/${statusMap[input.status ?? "scheduled"]}`,
    eventAttendanceMode: `https://schema.org/${mode}`,
    location: locations.length === 1 ? locations[0] : locations.length ? locations : undefined,
    organizer: input.organizerName ? { "@type": "Organization", name: input.organizerName } : undefined,
    offers:
      typeof input.price === "number"
        ? {
            "@type": "Offer",
            url,
            price: input.price,
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
          }
        : undefined,
  });
}

/** Wraps one or more nodes into a single JSON-LD document with @context. */
export function graphJsonLd(...nodes: Thing[]): Thing {
  if (nodes.length === 1) return { "@context": "https://schema.org", ...nodes[0] };
  return { "@context": "https://schema.org", "@graph": nodes };
}

/** JSON.stringify that cannot close the surrounding <script> tag. */
export function serializeJsonLd(data: Thing): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/[\u2028\u2029]/g, "");
}

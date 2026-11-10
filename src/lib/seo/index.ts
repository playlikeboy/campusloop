import type { Metadata } from "next";

/**
 * Single source of truth for page metadata and structured data.
 *
 * Every page should build its `metadata` / `generateMetadata` result with
 * `buildMetadata()` instead of hand-writing openGraph/twitter/canonical
 * objects. The root layout sets the title template `%s · CampusLoop`, so pass
 * the bare page title ("Safety", not "Safety · CampusLoop").
 */

import {
  absoluteUrl,
  DEFAULT_OG_IMAGE,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
  TITLE_TEMPLATE,
  TWITTER_HANDLE,
} from "./constants";

export * from "./constants";

/** Drops a trailing "· CampusLoop" / "| CampusLoop" so the template never doubles it. */
export function cleanTitle(title: string): string {
  return title
    .replace(/\s*[·|\-–—]\s*CampusLoop\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * URL of the dynamic share card served by `src/app/og/route.tsx`.
 * Opt in per page with `image: ogImageUrl(title, "Events")`.
 */
export function ogImageUrl(title: string, kicker?: string): string {
  const params = new URLSearchParams({ title: cleanTitle(title).slice(0, 120) });
  if (kicker) params.set("kicker", kicker.slice(0, 40));
  return `${SITE_URL}/og?${params.toString()}`;
}

export type BuildMetadataInput = {
  /** Bare page title. The layout template appends " · CampusLoop". */
  title: string;
  /** One or two plain sentences, ideally 70 to 160 characters. No hype, no made-up numbers. */
  description: string;
  /** Path of the canonical URL, e.g. "/colleges/iit-delhi". Leave out query strings. */
  path: string;
  /** Absolute URL or site path of the share image. Defaults to /og-image.png. */
  image?: string | { url: string; width?: number; height?: number; alt?: string };
  /** Private, personal, thin or duplicate pages. Also drops them from link following. */
  noindex?: boolean;
  /** Use the title as-is, without the " · CampusLoop" template (home page only). */
  absoluteTitle?: boolean;
  /** "article" for articles and posts, "profile" for public profiles. */
  type?: "website" | "article" | "profile";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  keywords?: string[];
};

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const title = cleanTitle(input.title);
  const fullTitle = input.absoluteTitle ? title : TITLE_TEMPLATE.replace("%s", title);
  const description = input.description.replace(/\s+/g, " ").trim();
  const url = absoluteUrl(input.path.split("?")[0]);

  const image =
    input.image === undefined
      ? DEFAULT_OG_IMAGE
      : typeof input.image === "string"
        ? { url: absoluteUrl(input.image), alt: title }
        : { ...input.image, url: absoluteUrl(input.image.url), alt: input.image.alt ?? title };

  const openGraphBase = {
    title: fullTitle,
    description,
    url,
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    images: [image],
  };

  return {
    title: input.absoluteTitle ? { absolute: title } : title,
    description,
    keywords: input.keywords,
    alternates: { canonical: url },
    // Explicit on both branches: the (app) layout defaults to noindex, so
    // public pages inside it must opt back in.
    robots: input.noindex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true },
    openGraph:
      input.type === "article"
        ? {
            ...openGraphBase,
            type: "article",
            publishedTime: input.publishedTime,
            modifiedTime: input.modifiedTime,
            authors: input.authors,
          }
        : { ...openGraphBase, type: input.type ?? "website" },
    twitter: {
      card: "summary_large_image",
      site: TWITTER_HANDLE,
      title: fullTitle,
      description,
      images: [image.url],
    },
  };
}

/** Short metadata for private surfaces (chat, settings, admin, dating ...). */
export function privateMetadata(title: string): Metadata {
  return {
    title: cleanTitle(title),
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export {
  articleJsonLd,
  breadcrumbJsonLd,
  collegeJsonLd,
  eventJsonLd,
  graphJsonLd,
  organizationJsonLd,
  serializeJsonLd,
  websiteJsonLd,
} from "./json-ld";

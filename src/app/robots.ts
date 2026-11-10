import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/constants";

/**
 * Everything not listed here is crawlable by default, so there are no Allow
 * rules. Each Disallow below is a route whose pages also carry meta noindex
 * and are absent from every sitemap — see docs/fix/SEO_MATRIX.md.
 * When a page uses `buildMetadata({ noindex: true })` or `privateMetadata()`
 * from "@/lib/seo", add its path prefix here too.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: [
        "/courses?*",
        "/courses/category/*?*",
        "/admin",
        "/admin-login",
        "/api/",
        "/app/",
        "/feeds",
        "/chat",
        "/notifications",
        "/settings",
        "/saved",
        "/profile",
        "/@",
        "/confessions",
        "/dating",
        "/matching",
        "/crush",
        "/random",
        "/onboarding",
        "/academics/study-material/saved",
        "/academics/study-material/upload",
        "/marketplace/cart",
        "/marketplace/checkout",
        "/marketplace/order/",
        "/marketplace/orders",
        "/handler/",
        "/merchant-portal",
        "/invalid-email",
        "/logout",
        "/oauth/",
        "/search",
        "/explore?q=",
        "/birthdays",
        "/story/",
        "/courses/my",
        "/courses/new",
        "/developer/apps",
        "/communities/new",
        "/buy-and-sell/new",
        "/events/manage/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

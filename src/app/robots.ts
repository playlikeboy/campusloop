import type { MetadataRoute } from "next";

/**
 * Everything not listed here is crawlable by default, so there are no Allow
 * rules. Each Disallow below is a route whose pages also carry meta noindex
 * and are absent from every sitemap — see docs/fix/SEO_MATRIX.md.
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
      ],
    },
    sitemap: "https://campusloop.space/sitemap.xml",
  };
}

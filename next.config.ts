import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  experimental: {
    staleTimes: {
      dynamic: 180,
      static: 600,
    },
    // ── Build memory budget ──
    webpackMemoryOptimizations: true,
    webpackBuildWorker: true,
    memoryBasedWorkersCount: true,
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "motion",
      "date-fns",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "sonner",
      "swr",
      "@radix-ui/react-icons",
      "@animateicons/react",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "media.giphy.com" },
      { protocol: "https", hostname: "i.giphy.com" },
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/manifest-merchant.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=(), interest-cohort=()",
          },
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/c/:id",
        destination: "/communities/:id",
        permanent: true,
      },
      {
        source: "/discover",
        destination: "/explore",
        permanent: true,
      },
      {
        source: "/search",
        destination: "/explore",
        permanent: true,
      },
      {
        source: "/app",
        destination: "/feeds",
        permanent: true,
      },
      {
        source: "/u/:username",
        destination: "/@:username",
        permanent: true,
      },
      {
        source: "/academics/playlists",
        destination: "/academics",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

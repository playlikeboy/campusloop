import { HexclaveProvider } from "@hexclave/next";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree, JetBrains_Mono, Noto_Sans_Devanagari } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { GoogleAnalyticsScripts, GoogleAnalyticsTracker } from "@/components/analytics/google-analytics";
import { ReferralTracker } from "@/components/analytics/referral-tracker";
import { SWRProvider } from "@/components/providers/swr-provider";
import { PWAInstallBanner } from "@/components/pwa/pwa-install-banner";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { RouteProgress } from "@/components/ui/route-progress";
import { organizationJsonLd, SITE_URL, websiteJsonLd } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { hexclaveServerApp } from "@/hexclave/server";
import "./globals.css";

// Display: heavy, slightly condensed captions (sticker headlines). Body/UI: Figtree.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  axes: ["wdth", "opsz"],
});
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-custom",
  weight: ["400", "500"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    // ds-allow: theme-color meta needs literal hex (mirrors --bg light)
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    // ds-allow: theme-color meta needs literal hex (mirrors --bg dark)
    { media: "(prefers-color-scheme: dark)", color: "#0D0A17" },
  ],
  width: "device-width",
  initialScale: 1,
  userScalable: true,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://campusloop.space"),
  title: {
    default: "CampusLoop · Verified campus social network for Indian college students",
    template: "%s · CampusLoop",
  },
  description:
    "Join your real campus. Speak freely. Stay safe. CampusLoop is the verified student-only social network gatekept by college email. Share confessions, drop polls, and connect with students across Indian colleges.",
  applicationName: "CampusLoop",
  authors: [{ name: "CampusLoop Team", url: "https://campusloop.space/about" }],
  generator: "Next.js",
  keywords: [
    "campus social network",
    "college confessions",
    "anonymous posting",
    "student community",
    "college polls",
    "campus matches",
    "verified student",
    "Indian college students",
    "campus events",
    "college notes",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CampusLoop",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://campusloop.space",
    types: {
      "application/rss+xml": "https://campusloop.space/feed.xml",
    },
  },
  openGraph: {
    title: "CampusLoop | Your Verified Campus Social Network",
    description:
      "Join your real campus. Speak freely. Stay safe. Meet students like you. Share confessions, run polls, and connect securely.",
    url: "https://campusloop.space",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://campusloop.space/og-image.png",
        width: 1200,
        height: 630,
        alt: "CampusLoop — Your Verified Campus Social Network",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusLoop | Your Verified Campus Social Network",
    description:
      "Join your real campus. Speak freely. Stay safe. Meet students like you. Share confessions, run polls, and connect securely.",
    creator: "@mycampusloop",
    images: ["https://campusloop.space/og-image.png"],
  },
  category: "social networking",
  classification: "Student Community Platform",
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
    ? {
        verification: {
          ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
            ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
            : {}),
          ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
            ? {
                other: {
                  "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION,
                },
              }
            : {}),
        },
      }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`font-sans antialiased ${bricolage.variable} ${figtree.variable} ${devanagari.variable} ${jetbrainsMono.variable}`}
      style={{
        ["--font-body" as string]:
          "var(--font-figtree), var(--font-devanagari), ui-sans-serif, system-ui, sans-serif",
        ["--font-display" as string]:
          "var(--font-bricolage), var(--font-devanagari), ui-sans-serif, system-ui, sans-serif",
      }}
      suppressHydrationWarning
    >
      <head>
        <link rel="dns-prefetch" href="https://skill.hexclave.com" />
        <link rel="dns-prefetch" href="https://api.dicebear.com" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="author" href="/humans.txt" />
        <link rel="help" href="/llms.txt" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CampusLoop" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* ds-allow: theme-color meta needs literal hex */}
        <meta name="theme-color" content="#0D0A17" media="(prefers-color-scheme: dark)" />
        {/* ds-allow: theme-color meta needs literal hex */}
        <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content="India" />
        <meta name="geo.position" content="20.5937;78.9629" />
        <meta name="ICBM" content="20.5937, 78.9629" />
        <JsonLd
          data={[
            { ...organizationJsonLd(), founder: { "@type": "Person", name: "Shaswat Raj" } },
            websiteJsonLd(),
            {
              "@type": "WebApplication",
              name: "CampusLoop",
              url: SITE_URL,
              applicationCategory: "SocialNetworkingApplication",
              operatingSystem: "Web, Android, iOS",
              offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
            },
          ]}
        />
        <link rel="preconnect" href="https://api.dicebear.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.dicebear.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && !window.__name) {
                window.__name = function(fn, name) {
                  try {
                    return Object.defineProperty(fn, 'name', { value: name, configurable: true });
                  } catch (_) {
                    return fn;
                  }
                };
              }

              try {
                if (localStorage.getItem('cl_theme') === 'dark' || (!localStorage.getItem('cl_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
              
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW registration failed:', err));
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <GoogleAnalyticsScripts />
        <HexclaveProvider app={hexclaveServerApp}>
          <SWRProvider>
            <Suspense fallback={null}>
              <ReferralTracker />
              <GoogleAnalyticsTracker />
            </Suspense>
            <RouteProgress />
            <OfflineIndicator />
            {children}
            <PWAInstallBanner />
            <Toaster position="top-center" richColors />
          </SWRProvider>
        </HexclaveProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, ExternalLink, ShieldAlert, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { InstagramIcon } from "@/components/ui/social-icons";

export const metadata: Metadata = {
  title: "Join CampusLoop | Verified Student Network",
  description: "Join your verified college campus community on CampusLoop using your official college email.",
};

export default function SignUpPage({
  searchParams,
}: {
  searchParams?: Promise<{ returnTo?: string }>;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between items-center p-4 sm:p-6 text-foreground">
      {/* Top Navbar Header */}
      <header className="w-full max-w-5xl flex items-center justify-between py-4">
        <BrandLogo href="/" size="md" />
        <Link
          href="/sign-in"
          className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          Already have an account? <span className="text-primary font-black">Sign In</span>
        </Link>
      </header>

      {/* Center Auth Card */}
      <main className="w-full max-w-md my-auto py-8">
        <div className="rounded-3xl border border-border/40 bg-card p-6 sm:p-8 shadow-xl shadow-black/5 space-y-6">
          <div className="space-y-2 text-center">
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
              <Sparkles className="size-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Join CampusLoop
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Connect with verified students, discover your campus pulse, confessions, and study materials.
            </p>
          </div>

          {/* Mandatory College Email Notice */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
              <ShieldAlert className="size-4 shrink-0" />
              <span>Only College Emails Accepted</span>
            </div>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed font-medium">
              Only use your <strong>college provided email</strong> (.ac.in, .edu.in, college domain) to Join. Personal Gmail, Yahoo, or Outlook will not work.
            </p>
          </div>

          {/* Primary CTA Button to Hexclave Flow */}
          <div className="space-y-3">
            <Link
              href="/handler/sign-up"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 px-4 text-sm font-black text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/95 active:scale-98 transition-all cursor-pointer"
            >
              <span>Get Started with College Email</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Directory & Instagram Help Section */}
          <div className="space-y-3 pt-3 border-t border-border/30 text-xs text-muted-foreground">
            <div className="flex items-start gap-2.5">
              <Building2 className="size-4 text-primary shrink-0 mt-0.5" />
              <p>
                Is your college not indexed yet?{" "}
                <Link
                  href="/colleges"
                  className="font-bold text-foreground hover:text-primary transition-colors underline underline-offset-2"
                >
                  Request college to be added in Campus Directory
                </Link>
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <InstagramIcon className="size-4 text-primary shrink-0 mt-0.5" />
              <p>
                Questions or support?{" "}
                <a
                  href="https://www.instagram.com/campusloop.space/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1 underline underline-offset-2"
                >
                  <span>DM us on Instagram Support</span>
                  <ExternalLink className="size-3" />
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl py-4 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} CampusLoop. Verified campus community for verified students.</p>
      </footer>
    </div>
  );
}

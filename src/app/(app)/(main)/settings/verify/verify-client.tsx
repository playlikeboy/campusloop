"use client";

import { ArrowLeft, Mail, School } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CampusUnlockedModal } from "@/components/preview/campus-unlocked-modal";
import { CollegePicker, type PickedCollege } from "@/components/trust/college-picker";
import { Button } from "@/components/ui/button";
import { GithubIcon } from "@/components/ui/social-icons";
import { VerifiedSticker } from "@/components/ui/stickers";
import type { VerificationMethod } from "@/lib/trust";
import { cn } from "@/lib/utils";
import { pickCollege } from "./actions";

const METHOD_LABEL: Record<VerificationMethod, string> = {
  college_email: "your college email",
  github_student: "the GitHub Student Developer Pack",
  admin: "the CampusLoop team",
};

interface VerifyClientProps {
  verified: boolean;
  method: VerificationMethod | null;
  githubLogin: string | null;
  collegeName: string | null;
  inViewerHub: boolean;
  githubConfigured: boolean;
  result: { tone: "success" | "error" | "info"; text: string } | null;
}

function Panel({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 space-y-3">
      <h2 id={`${id}-title`} className="px-1 text-lg text-fg">
        {title}
      </h2>
      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">{children}</div>
    </section>
  );
}

export function VerifyClient({
  verified,
  method,
  githubLogin,
  collegeName,
  inViewerHub,
  githubConfigured,
  result,
}: VerifyClientProps) {
  const router = useRouter();
  const [emailOpen, setEmailOpen] = useState(false);
  const [college, setCollege] = useState<PickedCollege | null>(null);
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);

  async function joinCollege() {
    if (!college || saving) return;
    setSaving(true);
    const res = await pickCollege(college.id).catch(() => ({ ok: false as const, error: "Couldn't save. Try again." }));
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`You joined ${res.collegeName.split(",")[0]}.`);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 pb-32 sm:px-6">
      <header className="mb-6 flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Back to settings">
          <Link href="/settings">
            <ArrowLeft aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="text-2xl text-fg">Verify your student status</h1>
      </header>

      {result && (
        <p
          role="status"
          className={cn(
            "mb-6 rounded-md p-3 text-sm font-medium",
            result.tone === "success" && "bg-verified-subtle text-verified-text",
            result.tone === "error" && "bg-danger-subtle text-danger",
            result.tone === "info" && "bg-surface-muted text-fg"
          )}
        >
          {result.text}
        </p>
      )}

      <div className="space-y-8">
        <Panel id="status" title="Your status">
          {verified ? (
            <div className="space-y-2">
              <VerifiedSticker size="sm" label="Verified student" college={collegeName ?? undefined} />
              <p className="text-sm text-fg-muted">
                {method ? `Verified with ${METHOD_LABEL[method]}` : "Verified"}
                {method === "github_student" && githubLogin ? ` (@${githubLogin}).` : "."} Everything on
                CampusLoop is open to you.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-fg">Not verified yet</p>
              <p className="text-sm text-fg-muted">
                You can use CampusLoop as a member. Verifying gets you the verified badge, puts you in Verified only
                feeds and unlocks things like Campus Match and anonymous posts.
              </p>
            </div>
          )}
        </Panel>

        {inViewerHub && (
          <Panel id="college" title="Pick your college">
            <p className="text-sm text-fg-muted">
              You're in Campus Preview. Pick your college to join its campus feed as a member. Nothing you've saved
              is lost.
            </p>
            <CollegePicker value={college} onChange={setCollege} />
            <Button onClick={() => void joinCollege()} disabled={!college} loading={saving} className="w-full sm:w-auto">
              <School aria-hidden="true" />
              Join this college
            </Button>
          </Panel>
        )}

        {!verified && (
          <>
            <Panel id="email" title="With your college email">
              <p className="text-sm text-fg-muted">
                We email a link to your college inbox. Open it and you're verified, and moved to that college.
              </p>
              <Button onClick={() => setEmailOpen(true)} className="w-full sm:w-auto">
                <Mail aria-hidden="true" />
                Verify college email
              </Button>
            </Panel>

            <Panel id="github" title="With the GitHub Student Developer Pack">
              <p className="text-sm text-fg-muted">
                No college email? If GitHub Education has approved you as a student, sign in with GitHub and we check
                your student status. We only read your GitHub username and student status, and we don't keep any
                access to your account. One GitHub account can verify one CampusLoop profile.
              </p>
              {githubConfigured ? (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  loading={leaving}
                  onClick={() => {
                    // A full navigation: the start route sets the state cookie and redirects to GitHub.
                    setLeaving(true);
                    window.location.assign("/api/verify/github/start");
                  }}
                >
                  <GithubIcon className="size-4" />
                  Verify with GitHub Student Pack
                </Button>
              ) : (
                <p className="rounded-md bg-surface-muted p-3 text-sm text-fg-muted">
                  GitHub verification isn't set up yet. Use your college email for now.
                </p>
              )}
              <p className="text-xs text-fg-subtle">
                Not in the pack yet?{" "}
                <a
                  href="https://education.github.com/pack"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand-text underline underline-offset-4"
                >
                  Apply on GitHub Education
                </a>
                . Approval can take a few days.
              </p>
            </Panel>
          </>
        )}
      </div>

      <CampusUnlockedModal isOpen={emailOpen} onClose={() => setEmailOpen(false)} onSuccess={() => router.refresh()} />
    </div>
  );
}

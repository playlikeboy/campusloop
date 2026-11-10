import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface DocsJoinBandProps {
  signedIn: boolean;
  /** Override the default student sign-up copy (e.g. on /developers). */
  title?: string;
  body?: string;
  href?: string;
  label?: string;
}

/** Closing call to action on docs pages: violet story field with one sticker button. */
export function DocsJoinBand({ signedIn, title, body, href, label }: DocsJoinBandProps) {
  return (
    <section className="story-field px-4 py-14 sm:py-20">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md">
          <h2 className="text-3xl text-story-field-fg sm:text-4xl">{title ?? "See it on your campus"}</h2>
          <p className="mt-2 text-base text-story-field-muted">
            {body ?? "Only students from your college can join. Sign up with your college email."}
          </p>
        </div>
        <Link
          href={href ?? (signedIn ? "/feeds" : "/sign-up")}
          className="sticker sticker-tilt-r cl-interactive inline-flex h-13 shrink-0 items-center gap-2 rounded-full px-6 text-base font-semibold transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-story-field-fg focus-visible:ring-offset-2 focus-visible:ring-offset-story-field"
        >
          {label ?? (signedIn ? "Open your feed" : "Join with college email")}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
    </section>
  );
}

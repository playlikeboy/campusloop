"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  GraduationCap,
  LifeBuoy,
  Mail,
  Newspaper,
  PhoneCall,
  Send,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  DocLayout,
  DocSection,
  type DocSectionRef,
  DocTable,
  LegalDocHeader,
} from "@/components/marketing/legal-doc";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

const SECTIONS: DocSectionRef[] = [
  { id: "desks", label: "Support desks" },
  { id: "urgent", label: "Urgent concerns" },
  { id: "college", label: "Add your college" },
  { id: "legal", label: "Legal contacts" },
];

interface SupportDesk {
  id: string;
  name: string;
  email: string;
  description: string;
  sla: string;
  icon: React.ElementType;
}

const DESKS: SupportDesk[] = [
  {
    id: "general",
    name: "General support",
    email: "support@campusloop.space",
    description: "Account and login issues, student verification help, bug reports and app feedback.",
    sla: "Reply within 24 hours",
    icon: LifeBuoy,
  },
  {
    id: "safety",
    name: "Trust and safety",
    email: "safety@campusloop.space",
    description: "Ragging, harassment, doxxing and other student safety concerns.",
    sla: "Priority, within 12 hours",
    icon: ShieldAlert,
  },
  {
    id: "privacy",
    name: "Privacy and data",
    email: "privacy@campusloop.space",
    description: "Access, correction and erasure requests under India's DPDP Act, 2023.",
    sla: "Reply within 48 hours",
    icon: ShieldCheck,
  },
  {
    id: "partnerships",
    name: "Campus partnerships",
    email: "partners@campusloop.space",
    description: "New college domains, club partnerships and Campus Ambassador applications.",
    sla: "Reply within 24 hours",
    icon: GraduationCap,
  },
  {
    id: "press",
    name: "Press and media",
    email: "press@campusloop.space",
    description: "Journalist enquiries, founder interviews and brand assets.",
    sla: "Reply within 48 hours",
    icon: Newspaper,
  },
];

export function ContactClient() {
  const [copiedDesk, setCopiedDesk] = useState<string | null>(null);

  const copyEmail = (deskId: string, email: string) => {
    navigator.clipboard.writeText(email);
    sounds.ting();
    haptics.light();
    setCopiedDesk(deskId);
    setTimeout(() => setCopiedDesk(null), 2000);
  };

  return (
    <main className="py-12 sm:py-16">
      <DocLayout sections={SECTIONS}>
        <LegalDocHeader
          title="Contact CampusLoop"
          summary="A person on the team reads every message. Pick the desk that matches your question so it reaches the right place quickly."
          meta={["English and Hindi", "Replies within one to two working days"]}
        />

        <DocSection id="desks" number={1} title="Support desks">
          <p>Copy an address or open your mail client:</p>

          <div className="grid gap-4 pt-2 sm:grid-cols-2">
            {DESKS.map((desk) => {
              const Icon = desk.icon;
              const isCopied = copiedDesk === desk.id;
              return (
                <div
                  key={desk.id}
                  className="flex flex-col justify-between rounded-lg border border-border bg-surface p-5"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex size-9 items-center justify-center rounded-md bg-brand-subtle text-brand-text">
                        <Icon className="size-4" aria-hidden />
                      </div>
                      <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-fg-muted">
                        {desk.sla}
                      </span>
                    </div>

                    <h3 className="mt-3.5 text-base font-semibold text-fg">{desk.name}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-fg-muted">{desk.description}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
                    <code className="truncate font-mono text-xs font-semibold text-fg">{desk.email}</code>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyEmail(desk.id, desk.email)}
                        className="flex size-9 items-center justify-center rounded-md border border-border bg-surface text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Copy ${desk.email}`}
                        title="Copy email address"
                      >
                        {isCopied ? <Check className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                      </button>

                      <a
                        href={`mailto:${desk.email}`}
                        onClick={() => {
                          sounds.tap();
                          haptics.light();
                        }}
                        className="flex size-9 items-center justify-center rounded-md bg-brand text-brand-fg transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Email ${desk.email}`}
                        title="Send email"
                      >
                        <Send className="size-4" aria-hidden />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DocSection>

        <DocSection id="urgent" number={2} title="Urgent safety or distress concerns">
          <p>
            If a student is in immediate danger or distress, contact a national emergency helpline before
            writing to us:
          </p>
          <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-danger bg-danger-subtle p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-fg">National Anti-Ragging Helpline (24x7, toll-free)</p>
              <p className="font-mono text-base font-semibold text-danger">1800-180-5522</p>
            </div>
            <Link
              href="/safety"
              onClick={() => {
                sounds.tap();
                haptics.light();
              }}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md bg-danger px-4 text-sm font-semibold text-danger-fg transition-colors hover:opacity-90"
            >
              <PhoneCall className="size-4" aria-hidden />
              <span>All helplines</span>
            </Link>
          </div>
          <p className="pt-2 text-sm leading-relaxed text-fg-muted">
            To flag a specific post, comment or confession, use the Report option on the item itself. Reports
            go straight to the moderation queue with their context.
          </p>
        </DocSection>

        <DocSection id="college" number={3} title="Add your college domain">
          <div className="space-y-3 rounded-lg border border-border bg-surface-muted p-5">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-4 text-brand-text" aria-hidden />
              <h3 className="text-sm font-semibold text-fg">Missing your college during sign up?</h3>
            </div>
            <p className="text-sm leading-relaxed text-fg-muted">
              If your college email domain is not recognised yet, request your college hub from the directory.
              The team reviews domain requests, usually within a day.
            </p>
            <Link
              href="/college-request"
              onClick={() => {
                sounds.tap();
                haptics.light();
              }}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
            >
              <span>Request a college hub</span>
              <Mail className="size-4" aria-hidden />
            </Link>
          </div>
        </DocSection>

        <DocSection id="legal" number={4} title="Legal and grievance contacts">
          <p>
            Published under Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media
            Ethics Code) Rules, 2021. Built to follow India&apos;s DPDP Act, 2023.
          </p>
          <DocTable
            rows={[
              {
                label: "Grievance Officer",
                value: (
                  <span>
                    Shaswat Raj,{" "}
                    <a
                      href="mailto:grievance@campusloop.space"
                      className="font-mono text-brand-text underline-offset-4 hover:underline"
                    >
                      grievance@campusloop.space
                    </a>
                  </span>
                ),
                note: "Acknowledged within 24 hours, resolved within 15 days.",
              },
              {
                label: "Privacy requests",
                value: (
                  <a
                    href="mailto:privacy@campusloop.space"
                    className="font-mono text-brand-text underline-offset-4 hover:underline"
                  >
                    privacy@campusloop.space
                  </a>
                ),
                note: "Access, correction and erasure requests answered within 48 working hours.",
              },
              {
                label: "Founder",
                value: "Shaswat Raj",
              },
              {
                label: "Legal entity",
                value: "CampusLoop (not yet incorporated)",
                note: "Operated from India.",
              },
            ]}
          />
        </DocSection>
      </DocLayout>
    </main>
  );
}

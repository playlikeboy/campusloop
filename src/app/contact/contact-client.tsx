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
import { CleanFooter } from "@/components/landing/clean-footer";
import { MinimalLandingNavbar } from "@/components/landing/minimal-landing-navbar";
import {
  DocLayout,
  DocSection,
  type DocSectionRef,
  DocTable,
  LegalDocHeader,
} from "@/components/marketing/legal-doc";
import { LegalNav } from "@/components/marketing/legal-nav";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

const SECTIONS: DocSectionRef[] = [
  { id: "desks", label: "Support Desks" },
  { id: "urgent", label: "Urgent Concerns" },
  { id: "college", label: "Add Your College" },
  { id: "statutory", label: "Statutory Contacts" },
];

interface SupportDesk {
  id: string;
  name: string;
  email: string;
  description: string;
  sla: string;
  slaColor: string;
  icon: React.ElementType;
}

const DESKS: SupportDesk[] = [
  {
    id: "general",
    name: "General Campus Support",
    email: "support@campusloop.space",
    description: "Account login issues, student verification help, bug reports, and app feedback.",
    sla: "Reply < 24 hrs",
    slaColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    icon: LifeBuoy,
  },
  {
    id: "safety",
    name: "Trust & Safety Desk",
    email: "safety@campusloop.space",
    description: "Anti-ragging violations, harassment escalations, doxxing alerts, and student safety concerns.",
    sla: "Priority < 12 hrs",
    slaColor: "text-red-500 bg-red-500/10 border-red-500/20",
    icon: ShieldAlert,
  },
  {
    id: "privacy",
    name: "Privacy & Data Protection",
    email: "privacy@campusloop.space",
    description: "Data principal access, personal data erasure, and DPDP Act 2023 statutory requests.",
    sla: "Reply < 48 hrs",
    slaColor: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    icon: ShieldCheck,
  },
  {
    id: "partnerships",
    name: "Campus Partnerships",
    email: "partners@campusloop.space",
    description: "Onboarding new university domains, club partnerships, and Campus Ambassador applications.",
    sla: "Reply < 24 hrs",
    slaColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    icon: GraduationCap,
  },
  {
    id: "press",
    name: "Press & Media",
    email: "press@campusloop.space",
    description: "Journalist enquiries, founder interviews, press releases, and brand asset access.",
    sla: "Reply < 48 hrs",
    slaColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
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
    <div className="flex min-h-screen flex-col bg-background text-foreground select-none">
      <MinimalLandingNavbar />
      <LegalNav />

      <main className="flex-1 py-8 sm:py-12">
        <DocLayout sections={SECTIONS}>
          <LegalDocHeader
            eyebrow="24x7 Help Desk"
            title="Contact CampusLoop"
            summary="A real human on the campus team reads every message. Routing your query to the dedicated desk below ensures it reaches the right specialist with minimum turnaround time."
            meta={["Average reply in < 24 hours", "English and Hindi", "Direct Support"]}
          />

          {/* Voxel Support Desks Grid */}
          <DocSection id="desks" number={1} title="Dedicated support desks">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Select the appropriate department below to copy or open your mail client directly:
            </p>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              {DESKS.map((desk) => {
                const Icon = desk.icon;
                const isCopied = copiedDesk === desk.id;
                return (
                  <div
                    key={desk.id}
                    className="group relative rounded-3xl border border-border/70 bg-card/85 p-5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="size-4.5" />
                        </div>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${desk.slaColor}`}
                        >
                          {desk.sla}
                        </span>
                      </div>

                      <h3 className="mt-3.5 text-sm sm:text-base font-extrabold text-foreground">
                        {desk.name}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {desk.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                      <code className="text-xs font-mono font-bold text-foreground truncate">
                        {desk.email}
                      </code>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyEmail(desk.id, desk.email)}
                          className="flex size-8 items-center justify-center rounded-xl border border-border/70 bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          aria-label={`Copy ${desk.email}`}
                          title="Copy email address"
                        >
                          {isCopied ? (
                            <Check className="size-3.5 text-[#16a34a] stroke-[3]" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </button>

                        <a
                          href={`mailto:${desk.email}`}
                          onClick={() => {
                            sounds.tap();
                            haptics.light();
                          }}
                          className="flex size-8 items-center justify-center rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-white transition-colors shadow-2xs cursor-pointer"
                          aria-label={`Email ${desk.email}`}
                          title="Send email"
                        >
                          <Send className="size-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </DocSection>

          {/* Urgent Concerns */}
          <DocSection id="urgent" number={2} title="Urgent safety or distress concerns">
            <p>
              If a student is in immediate danger, harm, or psychological distress, contact national emergency
              helplines immediately before writing to us:
            </p>
            <div className="rounded-2xl border-2 border-red-500/25 bg-red-500/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-red-500">Immediate Danger</span>
                <p className="text-xs sm:text-sm font-bold text-foreground">
                  National Anti-Ragging Helpline (24x7 Toll-Free)
                </p>
                <p className="font-mono text-sm font-black text-red-500">1800-180-5522</p>
              </div>
              <Link
                href="/safety"
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 hover:bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors shrink-0"
              >
                <PhoneCall className="size-3.5" />
                <span>View All Helplines</span>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pt-2">
              To flag a specific post, comment, or confession, use the three-dot &apos;Report&apos; option
              directly on the item. This routes directly into our real-time moderation escrow queue with
              associated context.
            </p>
          </DocSection>

          {/* Add Your College */}
          <DocSection id="college" number={3} title="Whitelist your college domain">
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-4 text-[#16a34a]" />
                <h3 className="text-sm font-bold text-foreground">Missing your university during sign up?</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If your university email domain (.ac.in, .edu, or private campus portal) is not yet recognized
                in our registry, you can submit an instant whitelist request through the College Hub Directory.
                Our campus team validates institutional domains within 24 hours.
              </p>
              <Link
                href="/colleges"
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary/90 transition-colors"
              >
                <span>Request College Hub</span>
                <Mail className="size-3.5" />
              </Link>
            </div>
          </DocSection>

          {/* Statutory Contacts */}
          <DocSection id="statutory" number={4} title="Statutory regulatory compliance">
            <p>
              Published in strict accordance with Rule 3(2) of the Information Technology (Intermediary
              Guidelines and Digital Media Ethics Code) Rules, 2021 and the Digital Personal Data Protection
              Act, 2023:
            </p>
            <DocTable
              rows={[
                {
                  label: "Grievance Officer",
                  value: (
                    <a
                      href="mailto:grievance@campusloop.space"
                      className="font-mono text-xs sm:text-sm text-[#16a34a] font-bold underline-offset-4 hover:underline"
                    >
                      grievance@campusloop.space
                    </a>
                  ),
                  note: "Statutory acknowledgement within 24 hours, resolution within 15 days.",
                },
                {
                  label: "Data Protection Officer",
                  value: (
                    <a
                      href="mailto:privacy@campusloop.space"
                      className="font-mono text-xs sm:text-sm text-[#16a34a] font-bold underline-offset-4 hover:underline"
                    >
                      privacy@campusloop.space
                    </a>
                  ),
                  note: "Statutory data requests answered within 24–48 working hours.",
                },
                {
                  label: "Corporate Legal Entity",
                  value: "CampusLoop Inc.",
                  note: "Registered in India. All rights reserved.",
                },
              ]}
            />
          </DocSection>
        </DocLayout>
      </main>

      <CleanFooter />
    </div>
  );
}

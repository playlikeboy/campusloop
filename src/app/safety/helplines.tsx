import { Mail, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const HELPLINES = [
  {
    name: "National Anti-Ragging Helpline",
    when: "24x7, free",
    number: "1800-180-5522",
    tel: "18001805522",
    note: "For students at any college in India.",
  },
  {
    name: "KIRAN mental health helpline",
    when: "24x7, free",
    number: "1800-599-0019",
    tel: "18005990019",
    note: "Government of India counselling, in 13 languages.",
  },
  {
    name: "Emergency (police, ambulance, women's safety)",
    when: "24x7",
    number: "112",
    tel: "112",
    note: "National emergency number. Women's helpline: 1091.",
  },
];

/** Emergency numbers as plain rows, each with one call button. */
export function Helplines() {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {HELPLINES.map((line) => (
        <li key={line.tel} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-fg">{line.name}</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-fg">{line.number}</p>
            <p className="text-sm text-fg-muted">
              {line.when}. {line.note}
            </p>
          </div>
          <a href={`tel:${line.tel}`} className={buttonVariants({ variant: "danger" })}>
            <Phone aria-hidden="true" />
            Call {line.number}
          </a>
        </li>
      ))}
      <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-fg">CampusLoop safety desk</p>
          <p className="mt-0.5 break-all text-base font-semibold text-fg">safety@campusloop.space</p>
          <p className="text-sm text-fg-muted">For harassment on CampusLoop. We reply within 12 hours.</p>
        </div>
        <a href="mailto:safety@campusloop.space" className={buttonVariants({ variant: "outline" })}>
          <Mail aria-hidden="true" />
          Email the safety desk
        </a>
      </li>
    </ul>
  );
}

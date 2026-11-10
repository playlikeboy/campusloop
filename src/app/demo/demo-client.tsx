"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DEMO_CREDENTIALS } from "@/lib/demo-credentials";

export const DEMO_EMAIL = DEMO_CREDENTIALS.email;
export const DEMO_PASSWORD = DEMO_CREDENTIALS.password;

const FIELDS = [
  { id: "email", label: "Email", value: DEMO_EMAIL },
  { id: "password", label: "Password", value: DEMO_PASSWORD },
] as const;

/** Demo sign-in details with copy buttons. */
export function DemoCredentials() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it yourself.");
    }
  };

  return (
    <div className="space-y-3">
      <dl className="divide-y divide-border rounded-lg border border-border bg-surface">
        {FIELDS.map((field) => (
          <div key={field.id} className="p-4">
            <dt className="text-sm text-fg-muted">{field.label}</dt>
            <dd className="mt-0.5 flex items-center justify-between gap-3">
              <span className="min-w-0 break-all font-mono text-base font-semibold text-fg select-all">
                {field.value}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copy(field.id, field.value)}
                aria-label={
                  copied === field.id ? `${field.label} copied` : `Copy ${field.label.toLowerCase()}`
                }
              >
                {copied === field.id ? (
                  <Check className="text-verified-text" aria-hidden="true" />
                ) : (
                  <Copy aria-hidden="true" />
                )}
              </Button>
            </dd>
          </div>
        ))}
      </dl>
      <Button
        type="button"
        variant="ghost"
        onClick={() => copy("both", `Email: ${DEMO_EMAIL}\nPassword: ${DEMO_PASSWORD}`)}
      >
        {copied === "both" ? (
          <Check className="text-verified-text" aria-hidden="true" />
        ) : (
          <Copy aria-hidden="true" />
        )}
        {copied === "both" ? "Copied both" : "Copy both"}
      </Button>
      <p className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </p>
    </div>
  );
}

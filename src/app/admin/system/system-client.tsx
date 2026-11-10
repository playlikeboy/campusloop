"use client";

import { Database, RefreshCw, Search, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface ServiceEnvInfo {
  name: string;
  category: string;
  isConfigured: boolean;
  notes: string;
}

interface SystemClientProps {
  envMatrix: ServiceEnvInfo[];
}

type PingAction = "ping_db" | "ping_redis" | "ping_qdrant";

const SERVICES: { action: PingAction; name: string; detail: string; icon: typeof Database }[] = [
  { action: "ping_db", name: "Postgres (Neon)", detail: "Runs SELECT 1 and times it", icon: Database },
  { action: "ping_redis", name: "Redis (Upstash)", detail: "Reads the interest cache", icon: Zap },
  { action: "ping_qdrant", name: "Qdrant", detail: "Checks the search collection", icon: Search },
];

export function SystemClient({ envMatrix }: SystemClientProps) {
  const [pending, setPending] = useState<PingAction | null>(null);
  const [results, setResults] = useState<Partial<Record<PingAction, string>>>({});

  async function ping(action: PingAction, name: string) {
    sounds.tap();
    haptics.light();
    setPending(action);
    try {
      const res = await fetch("/api/admin/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        latencyMs?: number;
        status?: string;
      };
      if (!res.ok) throw new Error(data.error);
      const result = action === "ping_db" ? `${data.latencyMs}ms (${data.status})` : (data.message ?? "OK");
      setResults((r) => ({ ...r, [action]: result }));
      toast.success(data.message ?? `${name} replied`);
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : `${name} didn't reply. Check its environment keys below.`
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-surface">
        <div className="border-b border-border p-4">
          <h2 className="font-sans text-base font-semibold text-fg">Check a service</h2>
          <p className="text-sm text-fg-muted">Send a test request and see how long it takes.</p>
        </div>
        <ul className="divide-y divide-border">
          {SERVICES.map(({ action, name, detail, icon: Icon }) => (
            <li key={action} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <Icon className="size-4 shrink-0 text-fg-muted" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-fg">{name}</p>
                  <p className="text-xs text-fg-muted">{detail}</p>
                  {results[action] && (
                    <p
                      className="mt-1 truncate text-xs font-semibold tabular-nums text-success"
                      aria-live="polite"
                    >
                      {results[action]}
                    </p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={pending !== null}
                loading={pending === action}
                onClick={() => ping(action, name)}
              >
                {pending !== action && <RefreshCw aria-hidden />}
                {pending === action ? "Checking" : "Check"}
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-border bg-surface">
        <div className="border-b border-border p-4">
          <h2 className="font-sans text-base font-semibold text-fg">Environment keys</h2>
          <p className="text-sm text-fg-muted">Shows whether each key is set. Values are never shown.</p>
        </div>
        <ul className="divide-y divide-border">
          {envMatrix.map((item) => (
            <li
              key={item.name}
              className="flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="flex flex-wrap items-center gap-2">
                  <code className="break-all font-mono text-sm font-semibold text-fg">{item.name}</code>
                  <span className="text-xs text-fg-muted">{item.category}</span>
                </p>
                <p className="text-sm text-fg-muted">{item.notes}</p>
              </div>
              <Badge
                variant={item.isConfigured ? "success" : "warning"}
                className="shrink-0 self-start sm:self-center"
              >
                {item.isConfigured ? "Set" : "Missing"}
              </Badge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

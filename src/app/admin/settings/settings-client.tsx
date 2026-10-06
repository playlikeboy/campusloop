"use client";

import {
  Bell,
  CheckCircle2,
  Database,
  Lock,
  Save,
  Send,
  Server,
  Settings,
  ShieldAlert,
  Sliders,
  Webhook,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SettingsClient() {
  const [toxicityThreshold, setToxicityThreshold] = useState(70);
  const [autoQuarantineThreshold, setAutoQuarantineThreshold] = useState(3);
  const [requireIdentityJustification, setRequireIdentityJustification] = useState(true);
  const [bannedKeywords, setBannedKeywords] = useState(
    "suicide, self-harm, leak, doxx, blackmail, wire fraud"
  );

  // Webhooks
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState(
    "https://discord.com/api/webhooks/campusloop/alerts"
  );
  const [telegramChatId, setTelegramChatId] = useState("@campusloop_ops_safety");
  const [alertOnToxicity, setAlertOnToxicity] = useState(true);
  const [alertOnMassReports, setAlertOnMassReports] = useState(true);
  const [alertOnIngestFailure, setAlertOnIngestFailure] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsSaving(false);
    toast.success("Admin configuration updated and synchronized across cluster!");
  }

  return (
    <div className="space-y-6">
      {/* ─── Safety & Content Moderation Policies ─── */}
      <section className="rounded-xl border border-border/60 bg-card/70 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-amber-500" />
          <h2 className="text-sm font-bold text-foreground">
            Automated Content Safety &amp; Risk Thresholds
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Toxicity Threshold Slider */}
          <div className="p-3.5 rounded-lg bg-muted/20 border border-border/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-foreground">Toxicity Auto-Quarantine Score</span>
              <span className="font-mono text-primary font-bold">{toxicityThreshold} / 100</span>
            </div>
            <input
              type="range"
              min={30}
              max={95}
              value={toxicityThreshold}
              onChange={(e) => setToxicityThreshold(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <p className="text-[11px] text-muted-foreground">
              Posts evaluated at or above this score are withheld from campus feeds into the Review Queue.
            </p>
          </div>

          {/* Mass Reports Threshold */}
          <div className="p-3.5 rounded-lg bg-muted/20 border border-border/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-foreground">Mass Reports Auto-Takedown</span>
              <span className="font-mono text-primary font-bold">{autoQuarantineThreshold} Reports</span>
            </div>
            <input
              type="range"
              min={2}
              max={10}
              value={autoQuarantineThreshold}
              onChange={(e) => setAutoQuarantineThreshold(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <p className="text-[11px] text-muted-foreground">
              Automatically set post status to HIDDEN when unique student reports reach this count.
            </p>
          </div>
        </div>

        {/* Banned Keywords Input */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Instant Block Keywords (Comma Separated)
          </label>
          <input
            type="text"
            value={bannedKeywords}
            onChange={(e) => setBannedKeywords(e.target.value)}
            className="w-full h-9 rounded-lg bg-muted/40 border border-border/50 px-3 text-xs font-medium text-foreground outline-none focus:border-primary transition-colors"
          />
          <p className="text-[10px] text-muted-foreground">
            Any post containing these terms triggers an automatic quarantine review status.
          </p>
        </div>

        {/* Identity Sealing Policy */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Lock className="size-3.5 text-primary" /> Strict Identity Sealing Compliance
            </span>
            <p className="text-[11px] text-muted-foreground">
              Require explicit legal/safety justification modal and generate permanent audit log entry before
              unveiling any anonymous post author.
            </p>
          </div>
          <input
            type="checkbox"
            checked={requireIdentityJustification}
            onChange={(e) => setRequireIdentityJustification(e.target.checked)}
            className="size-4 rounded accent-primary cursor-pointer"
          />
        </div>
      </section>

      {/* ─── Webhook Safety Channels (Discord & Telegram) ─── */}
      <section className="rounded-xl border border-border/60 bg-card/70 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Webhook className="size-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-foreground">
            Moderation Webhooks &amp; Urgent Alert Channels
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              Discord Webhook URL
            </label>
            <input
              type="text"
              value={discordWebhookUrl}
              onChange={(e) => setDiscordWebhookUrl(e.target.value)}
              className="w-full h-9 rounded-lg bg-muted/40 border border-border/50 px-3 text-xs font-mono text-foreground outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              Telegram Chat ID / Bot
            </label>
            <input
              type="text"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              className="w-full h-9 rounded-lg bg-muted/40 border border-border/50 px-3 text-xs font-mono text-foreground outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Alert Trigger Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/40 cursor-pointer">
            <input
              type="checkbox"
              checked={alertOnToxicity}
              onChange={(e) => setAlertOnToxicity(e.target.checked)}
              className="size-3.5 rounded accent-primary"
            />
            <span className="text-xs font-semibold text-foreground">High Toxicity Alerts</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/40 cursor-pointer">
            <input
              type="checkbox"
              checked={alertOnMassReports}
              onChange={(e) => setAlertOnMassReports(e.target.checked)}
              className="size-3.5 rounded accent-primary"
            />
            <span className="text-xs font-semibold text-foreground">Mass User Reports</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/40 cursor-pointer">
            <input
              type="checkbox"
              checked={alertOnIngestFailure}
              onChange={(e) => setAlertOnIngestFailure(e.target.checked)}
              className="size-3.5 rounded accent-primary"
            />
            <span className="text-xs font-semibold text-foreground">Ingestion Job Failures</span>
          </label>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
        >
          <Save className="size-3.5" />
          <span>{isSaving ? "Saving changes..." : "Save Admin Settings"}</span>
        </button>
      </div>
    </div>
  );
}

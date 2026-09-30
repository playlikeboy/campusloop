import { getCloudflareContext } from "@opennextjs/cloudflare";

export const CLOUDFLARE_EMAIL_DOMAIN = process.env.CLOUDFLARE_EMAIL_DOMAIN || "mail.campsy.app";

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailOptions {
  to: string | string[] | EmailRecipient | EmailRecipient[];
  subject: string;
  text?: string;
  html?: string;
  from?: string; // Any address on mail.campsy.app (e.g. welcome@mail.campsy.app, notifications@mail.campsy.app)
  fromName?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
  provider?: "cloudflare-api" | "cloudflare-worker" | "simulated";
}

/**
 * Normalizes any sender into a valid `@mail.campsy.app` email address.
 * Supports prefixes like "welcome", "notifications", "support", or full addresses.
 */
export function normalizeSenderAddress(from?: string): string {
  if (!from || !from.trim()) {
    return `welcome@${CLOUDFLARE_EMAIL_DOMAIN}`;
  }
  const clean = from.trim().toLowerCase();
  if (clean.includes("@")) {
    // If it's already using mail.campsy.app or any domain, return or map
    if (clean.endsWith(`@${CLOUDFLARE_EMAIL_DOMAIN}`)) {
      return clean;
    }
    // If it was using legacy domain, switch to mail.campsy.app
    const prefix = clean.split("@")[0];
    return `${prefix}@${CLOUDFLARE_EMAIL_DOMAIN}`;
  }
  return `${clean}@${CLOUDFLARE_EMAIL_DOMAIN}`;
}

/**
 * Normalizes recipients into a list of EmailRecipient objects
 */
function normalizeRecipients(
  recipients: string | string[] | EmailRecipient | EmailRecipient[]
): EmailRecipient[] {
  if (Array.isArray(recipients)) {
    return recipients.map((r) =>
      typeof r === "string" ? { email: r.trim() } : { email: r.email.trim(), name: r.name }
    );
  }
  if (typeof recipients === "string") {
    return [{ email: recipients.trim() }];
  }
  return [{ email: recipients.email.trim(), name: recipients.name }];
}

/**
 * Universal email sender powered by Cloudflare Email Sending.
 *
 * Direct REST API integration with Cloudflare Email Sending:
 * https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send
 * Authenticated via CLOUDFLARE_API_TOKEN_EMAIL_SENDING.
 *
 * Sender Domain: mail.campsy.app (e.g. welcome@mail.campsy.app, notifications@mail.campsy.app)
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const recipients = normalizeRecipients(options.to);
  if (recipients.length === 0) {
    return { success: false, error: "No recipients provided" };
  }

  // Retrieve Cloudflare runtime bindings or environment variables
  let envVars: Record<string, unknown> | undefined;
  try {
    const ctx = getCloudflareContext();
    envVars = (ctx?.env as unknown as Record<string, unknown>) || undefined;
  } catch {
    // Expected when running outside Cloudflare Worker runtime
  }

  const accountId =
    (envVars?.CLOUDFLARE_ACCOUNT_ID as string | undefined) ||
    process.env.CLOUDFLARE_ACCOUNT_ID;

  const apiToken =
    (envVars?.CLOUDFLARE_API_TOKEN_EMAIL_SENDING as string | undefined) ||
    process.env.CLOUDFLARE_API_TOKEN_EMAIL_SENDING ||
    (envVars?.CLOUDFLARE_API_TOKEN as string | undefined) ||
    process.env.CLOUDFLARE_API_TOKEN;

  const defaultFrom =
    (envVars?.CLOUDFLARE_EMAIL_FROM as string | undefined) ||
    process.env.CLOUDFLARE_EMAIL_FROM ||
    `welcome@${CLOUDFLARE_EMAIL_DOMAIN}`;

  const defaultFromName =
    (envVars?.CLOUDFLARE_EMAIL_NAME as string | undefined) ||
    process.env.CLOUDFLARE_EMAIL_NAME ||
    "CampusLoop";

  const senderEmail = normalizeSenderAddress(options.from || defaultFrom);
  const senderName = options.fromName || defaultFromName;
  const replyTo =
    options.replyTo ||
    (envVars?.CLOUDFLARE_REPLY_TO as string | undefined) ||
    process.env.CLOUDFLARE_REPLY_TO ||
    `support@${CLOUDFLARE_EMAIL_DOMAIN}`;

  const plainText = options.text || options.html?.replace(/<[^>]*>?/gm, "") || options.subject;
  const htmlContent = options.html || `<p>${plainText.replace(/\n/g, "<br/>")}</p>`;

  // Format RFC 5322 "Name <email>" sender
  const formattedFrom = senderName ? `${senderName} <${senderEmail}>` : senderEmail;

  // ─── 1. Primary: Cloudflare Email Sending REST API ───
  if (accountId && apiToken) {
    try {
      const recipientEmails = recipients.map((r) => r.email);
      const toPayload = recipientEmails.length === 1 ? recipientEmails[0] : recipientEmails;

      const payload: Record<string, unknown> = {
        from: formattedFrom,
        to: toPayload,
        subject: options.subject,
        text: plainText,
        html: htmlContent,
      };

      if (replyTo) {
        payload.reply_to = replyTo;
      }

      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        const data = (await res.json()) as {
          success?: boolean;
          result?: { message_id?: string; delivered?: string[]; queued?: string[] };
        };

        return {
          success: true,
          provider: "cloudflare-api",
          messageId: data?.result?.message_id || `cfapi_${Date.now()}`,
        };
      } else {
        const errData = await res.text();
        console.warn("[Cloudflare Email REST API error]:", res.status, errData);
      }
    } catch (apiErr) {
      console.warn("[Cloudflare Email REST API fetch failed]:", apiErr);
    }
  }

  // ─── 2. Fallback: Native Cloudflare Worker Binding (`env.EMAIL`) ───
  if (envVars?.EMAIL && typeof (envVars.EMAIL as any).send === "function") {
    try {
      await (envVars.EMAIL as any).send({
        from: { email: senderEmail, name: senderName },
        to: recipients.map((r) => (r.name ? { email: r.email, name: r.name } : { email: r.email })),
        subject: options.subject,
        text: plainText,
        html: htmlContent,
        replyTo: { email: replyTo, name: senderName },
      });

      return {
        success: true,
        provider: "cloudflare-worker",
        messageId: `cfw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      };
    } catch (workerErr) {
      console.warn("[Cloudflare Email Worker send failed]:", workerErr);
    }
  }

  // ─── 3. Local Development Simulation Fallback ───
  console.log("📨 [Simulated Email Delivery]:", {
    from: formattedFrom,
    to: recipients.map((r) => r.email).join(", "),
    subject: options.subject,
    preview: plainText.slice(0, 100),
  });

  return {
    success: true,
    simulated: true,
    provider: "simulated",
    messageId: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
}

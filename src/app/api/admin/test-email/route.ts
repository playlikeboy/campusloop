import { type NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/app/admin/_lib/guard";
import { sendEmail } from "@/lib/email";
import { buildNotificationEmail, buildWelcomeEmail } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

interface TestEmailBody {
  to?: string;
  from?: string;
  type?: string;
  displayName?: string;
  collegeName?: string;
  recipientName?: string;
  actorName?: string;
  notificationType?: "MENTION" | "REPLY" | "MATCH";
  snippet?: string;
  subject?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Ensure admin authorization (via Bearer token / API key or admin session)
    const authHeader = req.headers.get("authorization") || req.headers.get("x-api-key");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader?.trim();
    const adminPasskey = process.env.ADMIN_PASSKEY || "29092005";
    const isTokenAuthorized = token && (token === adminPasskey || (process.env.ADMIN_SESSION_SECRET && token === process.env.ADMIN_SESSION_SECRET));

    if (!isTokenAuthorized) {
      const auth = await requireAdminApi();
      if (!auth.authorized) return auth.errorResponse;
    }

    const body = ((await req.json().catch(() => ({}))) || {}) as TestEmailBody;
    const to = body.to?.trim() || "shaswatraj3@gmail.com";
    const type = body.type || "NOTIFICATION";

    let emailPayload: { subject: string; html: string; text: string };

    if (type === "WELCOME") {
      emailPayload = buildWelcomeEmail({
        displayName: body.displayName || "Test Student",
        collegeName: body.collegeName || "Birla Institute of Technology, Mesra",
      });
    } else {
      emailPayload = buildNotificationEmail({
        recipientName: body.recipientName || "Test Student",
        actorName: body.actorName || "campusloop",
        type: body.notificationType || "MENTION",
        snippet: body.snippet || "Hey! Testing the Cloudflare Email notification delivery on CampusLoop.",
      });
    }

    const result = await sendEmail({
      to,
      from: body.from || (type === "WELCOME" ? "welcome@mail.campsy.app" : "notifications@mail.campsy.app"),
      subject: body.subject || emailPayload.subject,
      html: emailPayload.html,
      text: emailPayload.text,
    });

    return NextResponse.json({
      success: result.success,
      provider: result.provider,
      messageId: result.messageId,
      simulated: result.simulated,
      error: result.error,
      recipient: to,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send test email",
      },
      { status: 500 }
    );
  }
}

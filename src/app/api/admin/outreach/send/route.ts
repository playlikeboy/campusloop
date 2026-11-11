import { eq, inArray } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/app/admin/_lib/guard";
import { getDb } from "@/db";
import { outreachContacts, type OutreachContact } from "@/db/schema";
import { runInBackground } from "@/lib/background";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function generateOutreachEmailHtml({
  name,
  collegeName,
  collegeSlug,
  role,
}: {
  name: string;
  collegeName: string;
  collegeSlug: string;
  role: string;
}) {
  const collegeUrl = `https://campusloop.space/colleges`;
  const joinUrl = `https://campusloop.space/sign-up?ref=outreach_${collegeSlug}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test run CampusLoop at ${collegeName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
    
    <!-- Header -->
    <div style="background-color: #0f172a; padding: 28px 32px; text-align: left;">
      <span style="display: inline-block; background-color: #3b82f6; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px;">CampusLoop · Verified Student Network</span>
      <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 6px 0; line-height: 1.3;">Invitation to test run CampusLoop at ${collegeName}</h1>
      <p style="color: #94a3b8; font-size: 13px; margin: 0;">A private, student-only platform for Indian campus life</p>
    </div>

    <!-- Content -->
    <div style="padding: 32px; font-size: 14px; line-height: 1.6; color: #334155;">
      <p style="margin-top: 0;">Hi <strong>${name}</strong>,</p>

      <p>I hope you're having a productive semester! I'm reaching out because of your active involvement at <strong>${collegeName}</strong>.</p>

      <p>We built <strong>CampusLoop</strong> (https://campusloop.space) — a modern, verified social platform made exclusively for Indian college students. Unlike open networks filled with spam and outsiders, CampusLoop is gated strictly to verified college students (using official college email addresses).</p>

      <div style="background-color: #f1f5f9; border-radius: 12px; padding: 18px 20px; margin: 24px 0;">
        <p style="font-weight: 600; font-size: 14px; margin: 0 0 10px 0; color: #0f172a;">What students do on CampusLoop:</p>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">
          <li style="margin-bottom: 6px;"><strong>Real Campus Feed &amp; Hubs:</strong> Live discussions, placement experiences, and society updates across Indian colleges.</li>
          <li style="margin-bottom: 6px;"><strong>Responsible Anonymity:</strong> Honest campus confessions &amp; questions with automated safety protection.</li>
          <li style="margin-bottom: 6px;"><strong>Free Academic Vault:</strong> Share and access past year question papers (PYQs), professor notes, and semester playlists.</li>
          <li><strong>Student Match &amp; Dating:</strong> Connect with fellow verified students on your campus or nearby colleges.</li>
        </ul>
      </div>

      <p>Your institution's campus hub is already indexed on CampusLoop. We'd love to invite you to take a <strong>2-minute test run</strong> of the platform, check out your college feed, and tell us what you think.</p>

      <!-- Action Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${joinUrl}" style="background-color: #2563eb; color: #ffffff; display: inline-block; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 9999px; text-decoration: none; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);">Test Run CampusLoop &rarr;</a>
      </div>

      <p style="font-size: 13px; color: #64748b;">
        If you find it interesting and would like to help lead early campus activities at ${collegeName}, or if your student society would like to partner with us, simply reply directly to this email — I personally read and respond to every note.
      </p>

      <p style="margin-bottom: 0;">Warm regards,<br>
      <strong>The CampusLoop Team</strong><br>
      <span style="font-size: 12px; color: #64748b;">New Delhi · Bengaluru</span><br>
      <a href="https://campusloop.space" style="color: #2563eb; text-decoration: none; font-size: 12px;">campusloop.space</a> · 
      <a href="https://instagram.com/campusloop.space" style="color: #2563eb; text-decoration: none; font-size: 12px;">Instagram @campusloop.space</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; font-size: 11px; color: #94a3b8; text-align: center;">
      You received this one-time invitation as a recognized student representative or society lead at ${collegeName}. If you do not wish to receive further notes, please let us know by replying.
    </div>
  </div>
</body>
</html>
  `.trim();
}

type OutreachSendResult = { id: string; email: string; success: boolean; error?: string };

/** Sends one outreach email and records the outcome on the contact row. */
async function sendOutreachEmail(
  db: ReturnType<typeof getDb>,
  contact: OutreachContact
): Promise<OutreachSendResult> {
  const emailHtml = generateOutreachEmailHtml({
    name: contact.name,
    collegeName: contact.collegeName,
    collegeSlug: contact.collegeSlug,
    role: contact.role,
  });

  const emailSubject = `Invitation to test run CampusLoop at ${contact.collegeName}`;

  let errMessage: string;
  try {
    const sendResult = await sendEmail({
      to: { email: contact.email, name: contact.name },
      subject: emailSubject,
      html: emailHtml,
      text: `Hi ${contact.name},\n\nWe would love to invite you to test run CampusLoop at ${contact.collegeName}.\nCampusLoop is India's verified student-only campus network (https://campusloop.space).\n\nCheck out your college hub and share your feedback by replying directly to this email.\n\nWarm regards,\nThe CampusLoop Team`,
    });

    if (sendResult.success) {
      await db
        .update(outreachContacts)
        .set({
          status: "SENT",
          sentAt: new Date(),
          lastError: null,
          updatedAt: new Date(),
        })
        .where(eq(outreachContacts.id, contact.id));

      return { id: contact.id, email: contact.email, success: true };
    }
    errMessage = sendResult.error || "Email delivery failed";
  } catch (err) {
    errMessage = err instanceof Error ? err.message : "Unexpected error sending email";
  }

  await db
    .update(outreachContacts)
    .set({
      lastError: errMessage,
      updatedAt: new Date(),
    })
    .where(eq(outreachContacts.id, contact.id));

  return { id: contact.id, email: contact.email, success: false, error: errMessage };
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) return auth.errorResponse;

    const body = (await req.json()) as {
      contactId?: string;
      contactIds?: string[];
      sendAllPending?: boolean;
    };
    const { contactId, contactIds, sendAllPending } = body;

    const db = getDb();

    // Determine target contacts
    let targetContacts: OutreachContact[] = [];

    if (sendAllPending) {
      targetContacts = await db
        .select()
        .from(outreachContacts)
        .where(eq(outreachContacts.status, "PENDING"))
        .limit(50); // Safe batch cap per invoke
    } else if (Array.isArray(contactIds) && contactIds.length > 0) {
      targetContacts = await db
        .select()
        .from(outreachContacts)
        .where(inArray(outreachContacts.id, contactIds));
    } else if (contactId) {
      targetContacts = await db
        .select()
        .from(outreachContacts)
        .where(eq(outreachContacts.id, contactId));
    }

    if (targetContacts.length === 0) {
      return NextResponse.json(
        { success: false, error: "No pending contacts found to email" },
        { status: 400 }
      );
    }

    // A single invite is sent inline so the admin sees the real result right away.
    if (targetContacts.length === 1) {
      const result = await sendOutreachEmail(db, targetContacts[0]);
      return NextResponse.json({
        success: true,
        processed: 1,
        successCount: result.success ? 1 : 0,
        failCount: result.success ? 0 : 1,
        results: [result],
      });
    }

    // Batches go out after the response (kept alive with waitUntil); each
    // contact's status / lastError row records how its send went.
    const contacts = targetContacts;
    runInBackground(
      (async () => {
        for (const contact of contacts) {
          await sendOutreachEmail(db, contact);
          // Small throttling delay to prevent rapid-fire burst
          await new Promise((r) => setTimeout(r, 120));
        }
      })(),
      "admin outreach send"
    );

    return NextResponse.json(
      { success: true, queued: contacts.length, processed: contacts.length },
      { status: 202 }
    );
  } catch (error) {
    console.error("[Admin Outreach Send] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process outreach email dispatch" },
      { status: 500 }
    );
  }
}

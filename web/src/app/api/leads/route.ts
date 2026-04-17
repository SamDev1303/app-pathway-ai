import { z } from "zod";
import { Resend } from "resend";

const LeadSchema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(40),
  message: z.string().min(0).max(2000).optional().default(""),
  source: z.string().max(120).optional().default("footer modal"),
  consent_service: z.literal(true),
  consent_marketing: z.boolean().optional().default(false),
  consent_wording_version: z.string().min(1).max(40)
});

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = LeadSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const lead = parsed.data;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL ?? "sam@claudeking.org";
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "UniMate <onboarding@resend.dev>";
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("[unimate.leads] RESEND_API_KEY not set");
    return Response.json(
      { ok: false, error: "Email service unavailable" },
      { status: 503 }
    );
  }

  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      replyTo: lead.email,
      subject: `New UniMate lead — ${lead.full_name}`,
      text: [
        `Name: ${lead.full_name}`,
        `Email: ${lead.email}`,
        `Phone: ${lead.phone}`,
        ``,
        `Message:`,
        lead.message || "(none)",
        ``,
        `Source: atlas-ai ${lead.source}`,
        `Service consent: yes (required, Privacy Act 1988 (Cth), APP 5)`,
        `Marketing consent: ${lead.consent_marketing ? "yes" : "no"} (optional)`,
        `Consent wording version: ${lead.consent_wording_version}`,
        `Submitted: ${new Date().toISOString()}`
      ].join("\n")
    });
  } catch (err) {
    console.error("[unimate.leads] resend error", err);
    return Response.json(
      { ok: false, error: "We couldn't send your enquiry. Please call our Liverpool office on +61 2 8000 1234." },
      { status: 502 }
    );
  }

  return Response.json({ ok: true });
}

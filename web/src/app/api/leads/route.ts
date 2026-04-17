import { Resend } from "resend";
import {
  CONSENT_WORDING_VERSION,
  LeadInputSchema,
  type LeadInput,
} from "@/lib/lead-schema";
import { computeScore } from "@/lib/lead-score";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

/**
 * Atomic lead capture:
 *   1. Parse + Zod-validate the client payload
 *   2. Compute server-side score (client never sees the number)
 *   3. Stamp consent_given_at (server timestamp — never trusted from client)
 *   4. Pin consent_wording_version to the canonical constant (ignore client value)
 *   5. INSERT into Supabase `leads` via service-role client
 *   6. On INSERT success → send Resend email to LEAD_NOTIFY_EMAILS recipients
 *   7. On email failure AFTER successful INSERT → log + still return 200
 *      (lead is captured; losing a lead is worse than missing an email)
 *
 * Invariants (Gideon plan-check C5/C6 verified):
 *   - No row can land in `leads` before consent_service === true (DB CHECK
 *     rejects false, Zod z.literal(true) rejects at ingress)
 *   - No email can fire without a preceding successful INSERT
 *   - No external webhook call in v1 (N8N X.1.1 activation is
 *     Supabase-DB-webhook-driven, runs entirely outside this route)
 */
export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = LeadInputSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const lead = parsed.data;
  const { score, tier } = computeScore(lead);
  const consentGivenAt = new Date().toISOString();

  const userAgent = lead.user_agent ?? req.headers.get("user-agent") ?? undefined;
  const locale =
    lead.locale ??
    req.headers.get("accept-language")?.split(",")[0]?.trim() ??
    undefined;

  const row = buildLeadRow(lead, {
    score,
    consentGivenAt,
    userAgent,
    locale,
  });

  const supabase = createServiceRoleClient();
  const { error: insertError } = await supabase.from("leads").insert(row);

  if (insertError) {
    console.error("[atlas-ai.leads] INSERT failed", insertError);
    return Response.json(
      {
        ok: false,
        error:
          "We couldn't save your enquiry. Please try again or call our Liverpool office on +61 2 8000 1234.",
      },
      { status: 500 },
    );
  }

  const emailOk = await sendNotificationEmails({
    lead,
    score,
    tier,
    consentGivenAt,
  });

  if (!emailOk) {
    console.warn(
      "[atlas-ai.leads] Lead INSERT succeeded but email notification failed —",
      "lead row is captured in Supabase; Sam should check the manual audit trail",
      { email: lead.email, score, tier },
    );
  }

  return Response.json({ ok: true });
}

interface RowDerived {
  score: number;
  consentGivenAt: string;
  userAgent: string | undefined;
  locale: string | undefined;
}

function buildLeadRow(lead: LeadInput, derived: RowDerived) {
  return {
    // Step 1 — Personal (required)
    full_name: lead.full_name,
    email: lead.email,
    phone: lead.phone,
    country: lead.country,
    // Step 2 — Academic (nullable)
    highest_qualification: lead.highest_qualification ?? null,
    gpa: lead.gpa ?? null,
    ielts_overall: lead.ielts_overall ?? null,
    // Step 3 — Preferences (nullable)
    preferred_fields: lead.preferred_fields ?? null,
    preferred_levels: lead.preferred_levels ?? null,
    preferred_intake_month: lead.preferred_intake_month ?? null,
    // Step 4 — Budget (nullable)
    tuition_budget_aud: lead.tuition_budget_aud ?? null,
    living_budget_aud: lead.living_budget_aud ?? null,
    // Step 5 — Contact (nullable)
    preferred_contact_channel: lead.preferred_contact_channel ?? null,
    notes: lead.notes ?? null,
    // Consent — server-pinned wording version (ignore client value)
    consent_given_at: derived.consentGivenAt,
    consent_wording_version: CONSENT_WORDING_VERSION,
    consent_service: true,
    consent_marketing: lead.consent_marketing,
    // Derived
    lead_score: derived.score,
    // Meta
    user_agent: derived.userAgent ?? null,
    locale: derived.locale ?? null,
  };
}

async function sendNotificationEmails({
  lead,
  score,
  tier,
  consentGivenAt,
}: {
  lead: LeadInput;
  score: number;
  tier: "A" | "B" | "C" | "D";
  consentGivenAt: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[atlas-ai.leads] RESEND_API_KEY not set — skipping email send");
    return false;
  }

  const fromEmail =
    process.env.RESEND_FROM_EMAIL ?? "UniMate <onboarding@resend.dev>";

  const notifyRaw = process.env.LEAD_NOTIFY_EMAILS ?? "sam@claudeking.org";
  const recipients = notifyRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    console.error(
      "[atlas-ai.leads] LEAD_NOTIFY_EMAILS resolved to empty list after trim — falling back to sam@claudeking.org",
    );
    recipients.push("sam@claudeking.org");
  }

  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from: fromEmail,
      to: recipients,
      replyTo: lead.email,
      subject: `[UniMate lead · tier ${tier}] ${lead.full_name}`,
      text: [
        `Name: ${lead.full_name}`,
        `Email: ${lead.email}`,
        `Phone: ${lead.phone}`,
        `Country: ${lead.country}`,
        ``,
        `Lead score: ${score} (tier ${tier})`,
        ``,
        `Academic:`,
        `  Highest qualification: ${lead.highest_qualification ?? "—"}`,
        `  GPA: ${lead.gpa ?? "—"}`,
        `  IELTS overall: ${lead.ielts_overall ?? "—"}`,
        ``,
        `Preferences:`,
        `  Fields: ${(lead.preferred_fields ?? []).join(", ") || "—"}`,
        `  Levels: ${(lead.preferred_levels ?? []).join(", ") || "—"}`,
        `  Intake month: ${lead.preferred_intake_month ?? "—"}`,
        ``,
        `Budget:`,
        `  Tuition (AUD/yr): ${lead.tuition_budget_aud ?? "—"}`,
        `  Living (AUD/yr): ${lead.living_budget_aud ?? "—"}`,
        ``,
        `Contact:`,
        `  Preferred channel: ${lead.preferred_contact_channel ?? "—"}`,
        `  Notes: ${lead.notes || "(none)"}`,
        ``,
        `Source: atlas-ai ${lead.source}`,
        `Service consent: yes (required, Privacy Act 1988 (Cth), APP 5)`,
        `Marketing consent: ${lead.consent_marketing ? "yes" : "no"} (optional)`,
        `Consent wording version: ${CONSENT_WORDING_VERSION}`,
        `Consent given at: ${consentGivenAt}`,
      ].join("\n"),
    });
    return true;
  } catch (err) {
    console.error("[atlas-ai.leads] Resend error", err);
    return false;
  }
}

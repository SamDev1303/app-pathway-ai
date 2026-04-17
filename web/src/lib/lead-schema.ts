import { z } from "zod";
import type { CourseField, StudyLevel } from "./types";

/**
 * CANONICAL CONSENT WORDING VERSION — atlas-ai v1.
 *
 * Bump this hash whenever the APP 5 + APP 8 notice text in Step5Contact.tsx
 * changes. Both client (LeadModal submit) and server (/api/leads INSERT) MUST
 * import this constant — no string literal duplication.
 *
 * v2 (2026-04-17): adds APP 8 Singapore cross-border disclosure paragraph
 * per DEVIATIONS.md §DEV-001.
 */
export const CONSENT_WORDING_VERSION = "2026-04-17.v2" as const;

const CourseFieldEnum = z.enum([
  "IT",
  "Engineering",
  "Business",
  "Health",
  "Law",
  "Arts",
  "Science",
  "Education",
  "Architecture",
  "Social Work",
]) satisfies z.ZodType<CourseField>;

const StudyLevelEnum = z.enum(["undergraduate", "postgraduate", "vet"]) satisfies z.ZodType<StudyLevel>;

const ContactChannelEnum = z.enum(["email", "phone", "either"]);

/**
 * Client-submitted lead payload.
 *
 * Server-derived fields (`consent_given_at`, `lead_score`) are stamped in
 * `/api/leads/route.ts` — never trusted from the client. `consent_wording_version`
 * is also server-pinned at INSERT; the client sends it so the server can assert
 * the rendered notice matches the expected canonical text.
 */
export const LeadInputSchema = z.object({
  // Step 1 — Personal (all required)
  full_name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(40),
  country: z.string().min(2).max(80),

  // Step 2 — Academic (all optional)
  highest_qualification: z.string().max(60).optional(),
  gpa: z.number().min(0).max(4).optional(),
  ielts_overall: z.number().min(0).max(9).optional(),

  // Step 3 — Preferences (all optional)
  preferred_fields: z.array(CourseFieldEnum).max(10).optional(),
  preferred_levels: z.array(StudyLevelEnum).max(4).optional(),
  preferred_intake_month: z.number().int().min(1).max(12).optional(),

  // Step 4 — Budget (all optional)
  tuition_budget_aud: z.number().int().min(0).max(200000).optional(),
  living_budget_aud: z.number().int().min(0).max(200000).optional(),

  // Step 5 — Contact + Consent
  preferred_contact_channel: ContactChannelEnum.optional(),
  notes: z.string().max(2000).optional(),
  consent_service: z.literal(true),
  consent_marketing: z.boolean().default(false),
  /**
   * Client may send this as a hint for debugging (expected to equal
   * CONSENT_WORDING_VERSION), but the server IGNORES the value and pins
   * the canonical constant in `buildLeadRow()` on every INSERT. Accepting
   * any string here prevents "valid but off-by-one" client payloads from
   * silently drifting the audit trail — the DB row always carries the
   * server-owned canonical hash.
   */
  consent_wording_version: z.string().max(40).optional(),

  // Meta (client-observable, server-validates)
  source: z.string().max(120).optional().default("lead-modal"),
  user_agent: z.string().max(500).optional(),
  locale: z.string().max(20).optional(),
});

export type LeadInput = z.infer<typeof LeadInputSchema>;

/**
 * Server-derived shape after scoring + timestamping. This is what hits
 * the `leads` table via Supabase.
 */
export type LeadDbRow = LeadInput & {
  consent_given_at: string;
  lead_score: number;
};

export const LEAD_DRAFT_STORAGE_KEY = "atlas-ai.lead-draft.v1" as const;
export const LEAD_DRAFT_SCHEMA_VERSION = "v1" as const;
export const LEAD_DRAFT_TTL_DAYS = 30 as const;

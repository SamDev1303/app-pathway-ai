// web/src/app/api/sop/route.ts
// P6 wave 2: SOP generator — lead-gated, versioned, streaming, MARA-safe.
//
// Replaces the demo 4-field form route. New flow:
//   1. Resolve lead via service-role + leads.match_token (uuid).
//   2. Pre-filter leads.notes for migration phrases → 422 refusal.
//   3. Pre-filter lead profile + notes via scanForDeflection belt-and-braces.
//   4. Rate-limit (per-lead 10/day, per-IP 5/hr, global 100/day).
//   5. streamText with SOP_SYSTEM_PROMPT_V1 + structured <lead>/<target> block.
//   6. Cumulative-buffer post-filter (scanForDeflection) — swap to deflection
//      on hit + insert mara_deflections row.
//   7. onFinish → insert sop_drafts row with version_number = MAX+1, retried
//      up to 3x on Postgres 23505 (unique_violation) from the
//      UNIQUE(lead_id, version_number) constraint in migration 010.
//   8. Return stream + messageMetadata { draftId, versionNumber, deflected,
//      persistError } emitted on the `finish` part.
//   9. Restore path: if body has { restoreText, restoreFromDraftId }, skip
//      streamText entirely. Insert a new row with full_text=restoreText +
//      parent_draft_id=restoreFromDraftId, model="restored", and stream the
//      text back as a single chunk so the client UI treats it like a regen.

import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  SOP_SYSTEM_PROMPT_V1,
  SOP_SYSTEM_PROMPT_VERSION,
  SOP_PER_TURN_FOOTER,
  scanNotesForForbidden,
  SOP_NOTES_FORBIDDEN_MESSAGE,
} from "@/lib/sop-prompt";
import { scanForDeflection } from "@/lib/chat-deflection";
import { CHAT_MARA_DEFLECTION_RESPONSE } from "@/lib/chat-system-prompt";
import { logger } from "@/lib/logger";
import { checkSopRateLimit, SOP_RATE_LIMIT_MESSAGE } from "@/lib/ratelimit";

const LeadTokenSchema = z.uuid();

const log = logger.child({ route: "/api/sop" });

export const maxDuration = 60;

// ================================================================
// Model selection — mirrors /api/chat CHAT_MODEL selector shape.
// ================================================================
const SOP_MODEL =
  process.env.SOP_MODEL ??
  process.env.CHAT_MODEL ??
  "openrouter/qwen-free";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": "https://atlas-ai.vercel.app",
    "X-Title": "Atlas AI (sop)",
  },
});

function pickSopModel() {
  switch (SOP_MODEL) {
    case "openrouter/anthropic-sonnet":
    case "anthropic-gateway":
      return openrouter("anthropic/claude-sonnet-4-6");
    case "openrouter/openai-mini":
    case "openai-gateway":
      return openrouter("openai/gpt-4o-mini");
    case "openrouter/qwen-free":
    case "openrouter-free":
    default:
      return openrouter("qwen/qwen3-next-80b-a3b-instruct:free");
  }
}

// ================================================================
// Helpers
// ================================================================
function serviceRoleClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

async function logDeflection(
  userMessage: string,
  triggeredPhrase: string,
  supabase: SupabaseClient,
): Promise<void> {
  // session_id = null per P6 design (no chat_sessions tie-in on SOP path).
  const { error } = await supabase.from("mara_deflections").insert({
    session_id: null,
    user_message: userMessage.slice(0, 2000),
    triggered_phrase: triggeredPhrase,
  });
  if (error) log.warn({ err: error.message }, "deflection log failed");
}

async function nextVersionNumber(
  supabase: SupabaseClient,
  leadId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("sop_drafts")
    .select("version_number")
    .eq("lead_id", leadId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    log.warn({ err: error.message }, "version lookup failed");
    return 1;
  }
  return ((data?.version_number as number | undefined) ?? 0) + 1;
}

type InsertDraftArgs = {
  leadId: string;
  parentDraftId: string | null;
  fullText: string;
  model: string;
};

// Insert sop_drafts row with MAX+1 version. Retries up to 3 times on
// Postgres 23505 (unique_violation) — the UNIQUE(lead_id, version_number)
// constraint added in migration 010 turns concurrent MAX+1 races into
// retry-able errors rather than duplicate version numbers.
async function insertDraftWithRetry(
  supabase: SupabaseClient,
  args: InsertDraftArgs,
): Promise<{ id: string; versionNumber: number } | { error: string }> {
  const MAX_ATTEMPTS = 3;
  let lastErr = "unknown";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const vNum = await nextVersionNumber(supabase, args.leadId);
    const insert = await supabase
      .from("sop_drafts")
      .insert({
        lead_id: args.leadId,
        parent_draft_id: args.parentDraftId,
        version_number: vNum,
        full_text: args.fullText,
        sections: null,
        model: args.model,
        edited_from_section: null,
      })
      .select("id, version_number")
      .single();
    if (!insert.error && insert.data) {
      return {
        id: insert.data.id as string,
        versionNumber: insert.data.version_number as number,
      };
    }
    lastErr = insert.error?.message ?? "unknown";
    // Postgres 23505 = unique_violation. supabase-js exposes code on error.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code = (insert.error as any)?.code;
    if (code !== "23505") {
      log.warn({ err: lastErr }, "persist failed (non-retryable)");
      return { error: lastErr };
    }
    log.warn(
      `[atlas-ai.sop] 23505 on attempt ${attempt}/${MAX_ATTEMPTS} — retrying`,
    );
  }
  return { error: `unique_violation_retries_exhausted: ${lastErr}` };
}

// ================================================================
// Types + input parsing
// ================================================================
type SopRequest = {
  leadToken: string;
  selectedUniId?: string;
  selectedCourseName?: string;
  parentDraftId?: string | null;
  // Restore path — when both set, route skips streamText, inserts a new row
  // with full_text=restoreText + parent_draft_id=restoreFromDraftId, and
  // streams the text back as a single chunk.
  restoreText?: string;
  restoreFromDraftId?: string;
};

type LeadRow = {
  id: string;
  full_name: string | null;
  highest_qualification: string | null;
  gpa: number | null;
  ielts_overall: number | null;
  preferred_fields: string[] | null;
  preferred_levels: string[] | null;
  preferred_intake_month: number | null;
  tuition_budget_aud: number | null;
  notes: string | null;
  matches: unknown;
  match_token: string;
};

type MatchShape = {
  uni_id: string;
  uni_name: string;
  short_name?: string;
  course_name: string;
};

function pickTarget(
  lead: LeadRow,
  selectedUniId?: string,
  selectedCourseName?: string,
): { uniName: string; courseName: string } | null {
  const matches = lead.matches as
    | {
        strong?: MatchShape[];
        stretch?: MatchShape[];
      }
    | null
    | undefined;
  const pool = [...(matches?.strong ?? []), ...(matches?.stretch ?? [])];
  if (pool.length === 0) return null;

  if (selectedUniId && selectedCourseName) {
    const hit = pool.find(
      (m) =>
        m.uni_id === selectedUniId && m.course_name === selectedCourseName,
    );
    if (hit) return { uniName: hit.uni_name, courseName: hit.course_name };
  }

  const first = matches?.strong?.[0] ?? pool[0];
  return { uniName: first.uni_name, courseName: first.course_name };
}

function buildUserPrompt(
  lead: LeadRow,
  target: { uniName: string; courseName: string },
): string {
  const profileLines = [
    lead.full_name ? `full_name: ${lead.full_name}` : null,
    lead.highest_qualification
      ? `highest_qualification: ${lead.highest_qualification}`
      : null,
    lead.gpa != null ? `gpa: ${lead.gpa}` : null,
    lead.ielts_overall != null ? `ielts_overall: ${lead.ielts_overall}` : null,
    lead.preferred_fields?.length
      ? `preferred_fields: ${lead.preferred_fields.join(", ")}`
      : null,
    lead.preferred_levels?.length
      ? `preferred_levels: ${lead.preferred_levels.join(", ")}`
      : null,
    lead.preferred_intake_month
      ? `preferred_intake_month: ${lead.preferred_intake_month}`
      : null,
    lead.tuition_budget_aud
      ? `tuition_budget_aud: ${lead.tuition_budget_aud}`
      : null,
    lead.notes ? `notes: ${lead.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `<lead>
${profileLines}
</lead>
<target>
uni=${target.uniName} course=${target.courseName}
</target>

Write the full 4-paragraph SOP now. Plain prose, no formatting.`;
}

// ================================================================
// Canned stream (deflection / rate-limit / 422)
// ================================================================
function simpleStreamResponse(
  body: string,
  metadata: Record<string, unknown>,
  status = 200,
): Response {
  const encoder = new TextEncoder();
  const messageId = crypto.randomUUID();
  const lines = [
    { type: "start", messageId },
    { type: "start-step" },
    { type: "text-start", id: messageId },
    { type: "text-delta", id: messageId, delta: body },
    { type: "text-end", id: messageId },
    { type: "finish-step" },
    { type: "finish", messageMetadata: metadata },
  ];
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(line)}\n\n`),
        );
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status,
    headers: {
      "Content-Type": "text/event-stream",
      "x-vercel-ai-ui-message-stream": "v1",
    },
  });
}

// ================================================================
// POST
// ================================================================
export async function POST(req: Request) {
  const startedAt = Date.now();
  try {
    const body = (await req.json()) as Partial<SopRequest>;
    const tokenParse = LeadTokenSchema.safeParse(body.leadToken);
    if (!tokenParse.success) {
      return Response.json(
        { error: "Invalid leadToken (expected uuid)" },
        { status: 400 },
      );
    }

    const supabase = serviceRoleClient();
    if (!supabase) {
      return Response.json(
        { error: "Service unavailable" },
        { status: 503 },
      );
    }

    // Resolve lead by match_token.
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select(
        "id, full_name, highest_qualification, gpa, ielts_overall, preferred_fields, preferred_levels, preferred_intake_month, tuition_budget_aud, notes, matches, match_token",
      )
      .eq("match_token", body.leadToken)
      .maybeSingle<LeadRow>();

    if (leadErr) {
      log.error({ err: leadErr.message }, "lead lookup failed");
      return Response.json({ error: "Lookup failed" }, { status: 500 });
    }
    if (!lead) {
      return Response.json({ error: "Invalid lead token" }, { status: 404 });
    }

    // Pre-filter 1: explicit forbidden-phrase scan on notes (bake-in rule).
    if (lead.notes) {
      const hit = scanNotesForForbidden(lead.notes);
      if (hit) {
        return Response.json(
          { error: SOP_NOTES_FORBIDDEN_MESSAGE, triggered: hit },
          { status: 422 },
        );
      }
    }

    // Target = picked match or strong[0] default.
    const target = pickTarget(
      lead,
      body.selectedUniId,
      body.selectedCourseName,
    );
    if (!target) {
      return Response.json(
        {
          error:
            "No matches available yet. Complete the matcher first before drafting an SOP.",
        },
        { status: 422 },
      );
    }

    // Pre-filter 2: belt-and-braces deflection scan on target + notes combined.
    // If any migration phrasing leaked into notes past the explicit filter,
    // this catches it (e.g. "485" is in both lists).
    const preScanText = `${lead.notes ?? ""} ${target.courseName} ${target.uniName}`;
    const preScan = scanForDeflection(preScanText);
    if (preScan.matched) {
      await logDeflection(preScanText, preScan.phrase, supabase);
      return simpleStreamResponse(
        `${CHAT_MARA_DEFLECTION_RESPONSE}\n\n${SOP_PER_TURN_FOOTER}`,
        { deflected: true, triggeredPhrase: preScan.phrase },
      );
    }

    // Rate-limit.
    const rl = await checkSopRateLimit({
      ip: clientIp(req),
      leadId: lead.id,
    });
    if (!rl.ok) {
      log.warn({ reason: rl.reason, leadId: lead.id }, "rate-limit hit");
      return simpleStreamResponse(
        SOP_RATE_LIMIT_MESSAGE,
        { rateLimited: true, reason: rl.reason },
        429,
      );
    }

    // Holds the persisted row after onFinish — read by messageMetadata
    // callback so the final SSE frame carries real draftId + versionNumber.
    let persisted: { id: string; versionNumber: number } | null = null;
    let persistError: string | null = null;

    // Restore short-circuit — client sent restoreText + restoreFromDraftId.
    // Skip streamText entirely: insert a new row whose full_text = restoreText
    // and parent_draft_id = restoreFromDraftId, then stream the text back as
    // a single chunk so the client's version-history + current-text flows stay
    // consistent with a normal regenerate.
    const restoreText =
      typeof body.restoreText === "string" && body.restoreText.trim().length > 0
        ? body.restoreText
        : null;
    const restoreFromDraftId =
      typeof body.restoreFromDraftId === "string" &&
      body.restoreFromDraftId.length > 0
        ? body.restoreFromDraftId
        : null;
    if (restoreText && restoreFromDraftId) {
      // Validate that restoreFromDraftId belongs to this lead. Without this,
      // a client knowing any sop_drafts.id could forge a cross-lead parent
      // chain via the service-role insert below.
      const { data: parentDraft, error: parentErr } = await supabase
        .from("sop_drafts")
        .select("id, lead_id")
        .eq("id", restoreFromDraftId)
        .maybeSingle<{ id: string; lead_id: string }>();
      if (parentErr || !parentDraft || parentDraft.lead_id !== lead.id) {
        log.warn(
          { leadId: lead.id, restoreFromDraftId },
          "restore_source_invalid",
        );
        return Response.json(
          { error: "restore_source_invalid" },
          { status: 403 },
        );
      }
      const result = await insertDraftWithRetry(supabase, {
        leadId: lead.id,
        parentDraftId: restoreFromDraftId,
        fullText: restoreText,
        model: "restored",
      });
      if ("error" in result) {
        log.warn({ err: result.error, leadId: lead.id }, "restore persist failed");
        return Response.json(
          { error: "Restore failed — please retry." },
          { status: 503 },
        );
      }
      return simpleStreamResponse(restoreText, {
        draftId: result.id,
        versionNumber: result.versionNumber,
        deflected: false,
      });
    }

    // Model call.
    let postDeflection: { phrase: string } | null = null;
    let cumulativeBuffer = "";

    const postFilter = ({ stopStream }: { stopStream: () => void }) =>
      new TransformStream<Record<string, unknown>, Record<string, unknown>>({
        transform(chunk, controller) {
          if (postDeflection) return;
          if (chunk && chunk.type === "text-delta") {
            const delta =
              typeof chunk.delta === "string" ? chunk.delta : "";
            cumulativeBuffer += delta;
            const scan = scanForDeflection(cumulativeBuffer);
            if (scan.matched) {
              postDeflection = { phrase: scan.phrase };
              controller.enqueue({
                ...chunk,
                delta: `${CHAT_MARA_DEFLECTION_RESPONSE}\n\n${SOP_PER_TURN_FOOTER}`,
              });
              stopStream();
              return;
            }
          }
          controller.enqueue(chunk);
        },
      });

    const userPrompt = buildUserPrompt(lead, target);

    const result = streamText({
      model: pickSopModel(),
      system: SOP_SYSTEM_PROMPT_V1,
      prompt: userPrompt,
      temperature: 0.7,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      experimental_transform: postFilter as any,
      onFinish: async ({ text, usage }) => {
        try {
          if (postDeflection) {
            await logDeflection(
              userPrompt,
              postDeflection.phrase,
              supabase,
            );
          }

          // Persist sop_drafts row (even on deflection — keeps audit trail).
          const finalText = postDeflection
            ? `${CHAT_MARA_DEFLECTION_RESPONSE}\n\n${SOP_PER_TURN_FOOTER}`
            : (text ?? "");
          if (finalText.trim().length > 0) {
            const result = await insertDraftWithRetry(supabase, {
              leadId: lead.id,
              parentDraftId: body.parentDraftId ?? null,
              fullText: finalText,
              model: SOP_MODEL,
            });
            if ("error" in result) {
              // Log real DB error server-side; client gets generic signal only.
              log.error(
                { leadId: lead.id, err: result.error },
                "persist_failed",
              );
              persistError = "persist_failed";
            } else {
              persisted = result;
            }
          }

          log.info({
            model: SOP_MODEL,
            promptVersion: SOP_SYSTEM_PROMPT_VERSION,
            deflected: postDeflection != null,
            ms: Date.now() - startedAt,
            leadId: lead.id,
            inputTokens: usage?.inputTokens,
            outputTokens: usage?.outputTokens,
          }, "sop completed");
        } catch (err) {
          log.error({ err, leadId: lead.id }, "onFinish error");
        }
      },
    });

    return result.toUIMessageStreamResponse({
      messageMetadata: ({ part }) => {
        // Emit real persistence metadata on the finish frame so the client
        // can store the authoritative draftId + versionNumber (no more
        // `client-*` fallbacks). Honours the route header contract:
        // { draftId, versionNumber, deflected }.
        if (part.type === "finish") {
          return {
            draftId: persisted?.id ?? null,
            versionNumber: persisted?.versionNumber ?? null,
            deflected: postDeflection != null,
            persistError,
          };
        }
        return undefined;
      },
    });
  } catch (err) {
    log.error({ err }, "sop error");
    return Response.json(
      {
        error:
          "The SOP generator is briefly unavailable. Please try again — or book a free consultation at our Liverpool office.",
      },
      { status: 503 },
    );
  }
}

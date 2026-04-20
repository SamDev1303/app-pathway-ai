#!/usr/bin/env tsx
/**
 * Atlas AI — P5 wave 1: course embedding backfill.
 *
 * Reads every row in `courses` + joins `universities`, builds a compact
 * content string, embeds via Gemini `gemini-embedding-001` (3072-dim), and
 * upserts into `course_embeddings` via the SERVICE_ROLE key.
 *
 * Usage (from web/):
 *   npx tsx scripts/backfill-course-embeddings.ts            # dry-run
 *   npx tsx scripts/backfill-course-embeddings.ts --apply    # actually embed + upsert
 *
 * Rate-limit pattern: batches of 10, 2s sleep between (matches koda
 * feedback_notebooklm-batch-cadence.md).
 *
 * Idempotent: upsert by course_id, so re-runs re-embed the latest content
 * and overwrite. Safe to re-run after courses are updated.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const APPLY = process.argv.includes("--apply");
const BATCH_SIZE = 10;
const SLEEP_MS = 2000;
const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIMS = 3072;

function loadEnvLocal(): Record<string, string> {
  const envPath = resolve(__dirname, "..", ".env.local");
  if (!existsSync(envPath)) {
    throw new Error(`Missing ${envPath}. Populate Supabase + Gemini keys first.`);
  }
  const raw = readFileSync(envPath, "utf8");
  const env: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

type CourseRow = {
  id: string;
  name: string;
  level: string;
  field: string;
  duration_months: number;
  indicative_fee: number | null;
  ielts_overall: number | null;
  intake_months: number[] | null;
  industry_placement: boolean | null;
  cricos_code: string | null;
  universities: { name: string; short_name: string; state: string } | null;
};

function buildContent(row: CourseRow): string {
  const uni = row.universities?.name ?? "Unknown University";
  const fee = row.indicative_fee != null ? `AUD ${row.indicative_fee}/yr` : "fee n/a";
  const ielts = row.ielts_overall != null ? `IELTS ${row.ielts_overall}` : "IELTS n/a";
  const intakes = row.intake_months?.length ? row.intake_months.join(",") : "n/a";
  const placement = row.industry_placement ? "placement=yes" : "placement=no";
  return `${uni} · ${row.name} · level=${row.level} · field=${row.field} · fee=${fee} · ${ielts} · intake=${intakes} · ${placement}`;
}

async function embed(apiKey: string, text: string): Promise<number[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      outputDimensionality: EMBED_DIMS,
    }),
  });
  if (!res.ok) {
    throw new Error(`Gemini embed failed ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { embedding?: { values: number[] } };
  if (!json.embedding?.values) {
    throw new Error(`Gemini embed returned no values: ${JSON.stringify(json)}`);
  }
  return json.embedding.values;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const env = loadEnvLocal();
  const supaUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_KEY;
  const geminiKey = env.GOOGLE_AI_KEY ?? env.GEMINI_API_KEY ?? env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!supaUrl || !serviceKey) throw new Error("Missing Supabase URL / service-role key in web/.env.local");
  if (!geminiKey) throw new Error("Missing GOOGLE_AI_KEY / GEMINI_API_KEY in web/.env.local");

  const supabase = createClient(supaUrl, serviceKey, { auth: { persistSession: false } });

  const { data: courses, error } = await supabase
    .from("courses")
    .select(
      "id, name, level, field, duration_months, indicative_fee, ielts_overall, intake_months, industry_placement, cricos_code, universities(name, short_name, state)"
    )
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!courses) throw new Error("No courses returned");

  const rows = courses as unknown as CourseRow[];
  console.log(`--- Atlas AI P5 embedding backfill ---`);
  console.log(`Model: ${EMBED_MODEL} (${EMBED_DIMS}-dim)`);
  console.log(`Courses found: ${rows.length}`);
  console.log(`Batch size: ${BATCH_SIZE}, sleep: ${SLEEP_MS}ms`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.log(``);

  if (!APPLY) {
    for (const r of rows.slice(0, 3)) {
      console.log(`[dry-run sample] ${r.id}: ${buildContent(r)}`);
    }
    console.log(`\n(showing first 3) — run with --apply to embed + upsert all ${rows.length}.`);
    return;
  }

  let ok = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (row) => {
        const content = buildContent(row);
        try {
          const values = await embed(geminiKey, content);
          const { error: upErr } = await supabase.from("course_embeddings").upsert(
            {
              course_id: row.id,
              embedding: values,
              content,
              model: EMBED_MODEL,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "course_id" }
          );
          if (upErr) throw upErr;
          ok += 1;
          console.log(`[OK] ${row.id} ${row.name}`);
        } catch (err) {
          failed += 1;
          console.error(`[FAIL] ${row.id} ${row.name}:`, (err as Error).message);
        }
      })
    );
    if (i + BATCH_SIZE < rows.length) {
      console.log(`...sleeping ${SLEEP_MS}ms before next batch`);
      await sleep(SLEEP_MS);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Embedded + upserted: ${ok}`);
  console.log(`Failed: ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

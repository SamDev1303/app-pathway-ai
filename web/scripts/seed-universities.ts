#!/usr/bin/env tsx
/**
 * Atlas AI — P1 universities seed script
 *
 * Reads seedUniversities from web/src/lib/universities-seed.ts and inserts rows
 * into Supabase `universities` + `courses` tables using the SERVICE_ROLE key.
 *
 * Usage (run from the web/ workspace):
 *   cd ~/Desktop/atlas-ai/web
 *   npx tsx scripts/seed-universities.ts              # dry-run (prints plan)
 *   npx tsx scripts/seed-universities.ts --apply      # actually insert
 *   npx tsx scripts/seed-universities.ts --wipe       # delete existing rows first (CAREFUL)
 *
 * Prerequisites:
 *   1. supabase/migrations/001_initial_schema.sql applied (via `supabase db push` or dashboard)
 *   2. pgvector extension enabled
 *   3. web/.env.local populated with SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL
 *
 * Known limitations (flagged for P4.5 compliance gate):
 *   - `courses.cricos_code` will be seeded as NULL. The seed file contains each university's
 *     CRICOS provider code but NOT per-course CRICOS codes. Per PRD §5 + QEAC rule, courses
 *     MUST have per-course CRICOS codes before production launch. Plan for backfill in P4.5
 *     OR before any real consent-gated lead lands via `/api/match`.
 *   - `industry_placement` is part of the web type (used by matcher scoring) but NOT in the
 *     DB schema. Seed keeps it in the bundled `universities-seed.ts` for now. P4 will migrate
 *     the matcher to server-side; add column then.
 */

import { createClient } from "@supabase/supabase-js";
import { seedUniversities } from "../src/lib/universities-seed";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const APPLY = process.argv.includes("--apply");
const WIPE = process.argv.includes("--wipe");

// --- Load env from web/.env.local ---
function loadEnvLocal() {
  const envPath = resolve(__dirname, "..", ".env.local");
  if (!existsSync(envPath)) {
    throw new Error(`Missing ${envPath}. Populate Supabase keys first (see planning/atlas-ai/P1-HANDOFF.md)`);
  }
  const raw = readFileSync(envPath, "utf8");
  const env: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    env[key] = value;
  }
  return env;
}

async function main() {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      `Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in web/.env.local.\n` +
        `url=${url ? "present" : "MISSING"} serviceKey=${serviceKey ? "present" : "MISSING"}`
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  console.log(`--- Atlas AI seed ---`);
  console.log(`Project URL: ${url}`);
  console.log(`Universities to seed: ${seedUniversities.length}`);
  console.log(
    `Courses to seed: ${seedUniversities.reduce((sum, u) => sum + u.courses.length, 0)}`
  );
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}${WIPE ? " (with WIPE)" : ""}`);
  console.log(``);

  if (WIPE) {
    if (!APPLY) {
      console.log(`[dry-run] Would delete ALL rows from courses + universities`);
    } else {
      console.log(`WIPING existing rows...`);
      const { error: wipeCoursesErr } = await supabase.from("courses").delete().gt("created_at", "1970-01-01");
      if (wipeCoursesErr) throw wipeCoursesErr;
      const { error: wipeUnisErr } = await supabase.from("universities").delete().gt("created_at", "1970-01-01");
      if (wipeUnisErr) throw wipeUnisErr;
      console.log(`Wiped.`);
    }
  }

  let uniInserted = 0;
  let courseInserted = 0;

  for (const u of seedUniversities) {
    const uniRow = {
      slug: u.id, // use existing id field as slug (url-safe already: "unsw", "usyd", etc.)
      name: u.name,
      short_name: u.short_name,
      city: u.city,
      state: u.state,
      cricos_provider_code: u.cricos_code,
      qs_ranking_2025: u.qs_ranking_2025 ?? null,
      is_group_of_eight: u.is_group_of_eight,
      is_regional: u.regional ?? false,
      website: u.website,
      logo_letter: u.logo_letter,
      hero_color: u.hero_color,
    };

    if (!APPLY) {
      console.log(`[dry-run] universities INSERT slug=${uniRow.slug} (${u.courses.length} courses)`);
      continue;
    }

    const { data: uniData, error: uniErr } = await supabase
      .from("universities")
      .insert(uniRow)
      .select("id")
      .single();

    if (uniErr) {
      console.error(`[ERROR] ${u.id}: ${uniErr.message}`);
      throw uniErr;
    }
    uniInserted += 1;

    // Insert courses for this university
    const courseRows = u.courses.map((c) => ({
      university_id: uniData.id,
      cricos_code: null, // TODO(P4.5): backfill per-course CRICOS codes before production launch
      name: c.course_name,
      level: c.level,
      field: c.field,
      duration_months: c.duration_months,
      indicative_fee: c.annual_fee_aud,
      ielts_overall: c.ielts_min,
      intake_months: [2, 7], // default Feb + July — replace with per-course data when available
    }));

    const { error: courseErr } = await supabase.from("courses").insert(courseRows);
    if (courseErr) {
      console.error(`[ERROR] ${u.id} courses: ${courseErr.message}`);
      throw courseErr;
    }
    courseInserted += courseRows.length;

    console.log(`[OK] ${u.short_name} + ${courseRows.length} courses`);
  }

  console.log(``);
  console.log(`--- Summary ---`);
  if (APPLY) {
    console.log(`Universities inserted: ${uniInserted}`);
    console.log(`Courses inserted: ${courseInserted}`);
  } else {
    console.log(`DRY-RUN complete. Run with --apply to actually insert.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

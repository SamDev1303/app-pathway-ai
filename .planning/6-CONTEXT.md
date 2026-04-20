# P6 — SOP Generator + PDF Export — CONTEXT

**Phase:** P6
**Discuss-phase:** 2026-04-21 (Koda session s51)
**Inherits from:** P5/P5.1 patterns (CHAT_MODEL selector, MARA deflection, service-role RLS, audit tables)

## Scope

Rebuild SOP generator API off the Supabase `leads` profile (replacing demo's
shallow string-coercion in `web/src/app/api/sop/route.ts`). Ship react-pdf
client-side export with font preload + memory guard. Edit + regenerate loop
preserves section state via explicit draft versioning.

## Decisions locked in discuss-phase

| # | Decision | Rationale |
|---|---|---|
| **D1** | **Draft versioning = new `sop_drafts` table.** Columns: `id uuid PK`, `lead_id uuid FK leads`, `parent_draft_id uuid nullable (self-FK)`, `version_number int`, `full_text text`, `sections jsonb nullable`, `model text`, `edited_from_section text nullable`, `created_at timestamptz`. Service-role RLS (mirror migrations 007/008/009). | History queries stay sane; `parent_draft_id` reconstructs edit tree; avoids leads-row bloat on many revisions; RLS posture consistent with P5. |
| **D2** | **Whole-doc regen only in v1.** Every "regenerate" click rewrites all 4 paragraphs. Section-level regen deferred to P6.1 if UniMate asks. | 50 LOC vs 1.5 days for section-aware prompt template + merge logic. Most students iterate 2–3× then download — section-level only pays off at 10+ iterations. |
| **D3** | **Entry surface = `/sop/[leadToken]` only. No anonymous `/sop`.** Student completes matcher → `/matches/[token]` links to `/sop/[leadToken]` → SOP auto-populates from `leads.highest_qualification`, `leads.preferred_fields`, etc. | Lead-gated = richer auto-populate + CRM "lead has N SOP drafts" signal + UniMate agents view in Studio. Anonymous SEO play is v2. |
| **D4** | **Client-side react-pdf render only. No server PDF endpoint.** Browser renders blob → `saveAs`. Route access = unguessable `leadToken` uuid (same pattern as `/matches/[token]`). | PHASE.md task already locks client-side render; no signed-URL TTL to manage; no cookie mismatch; no PDF-at-rest storage to audit under APP 11. Text still persists in `sop_drafts` behind service-role RLS. |

## Inherited (not re-decided)

- **Model selector:** `SOP_MODEL` env mirrors P5.1's `CHAT_MODEL` — defaults to `openrouter/qwen-free` (`qwen/qwen3-next-80b-a3b-instruct:free`). Same legacy-alias fallback. Higher temperature (0.7) than chat (0.5) retained from current demo.
- **MARA compliance:** prompt-side deflection inherits the tone from current `web/src/app/api/sop/route.ts` (explicit "NEVER include visa / migration / residency" rules). Post-filter = cumulative-buffer scan via `scanForDeflection` from `@/lib/chat-deflection` — reused, not rewritten. `mara_deflections` audit insert on hit.
- **Per-turn footer:** `CHAT_PER_TURN_FOOTER` appended to SOP body OR SOP carries its own 1-line "Educational draft — not migration advice. Consult a MARA agent." footer burned into the PDF (P6 plan-phase decides).
- **Supabase access:** service-role client pattern from `chat-session.ts`. Sop reads + writes all go through service role.
- **Rate-limit:** reuse `@/lib/ratelimit` with a new key prefix `atlas:sop:*`. Plan-phase tunes the per-lead daily cap (target ~10 regens/lead/day).

## Critical files (plan-phase seed)

| File | Action |
|---|---|
| `supabase/migrations/010_sop_drafts.sql` | create — `sop_drafts` + RLS service-only + HNSW n/a |
| `web/src/app/api/sop/route.ts` | modify — rebuild off lead profile; persist draft; reuse deflection + rate-limit |
| `web/src/app/sop/[leadToken]/page.tsx` | create — entry surface, loads lead + latest draft, renders editor |
| `web/src/app/sop/[leadToken]/SopEditor.tsx` | create — client component, generate/regenerate UI, react-pdf preview + download |
| `web/src/lib/sop-prompt.ts` | create — staged SOP_SYSTEM_PROMPT_V1 + footer constant (mirror `chat-system-prompt.ts` module shape) |
| `web/src/components/sop/SopPdfDoc.tsx` | create — react-pdf `<Document>` + `<Page>` template (Georgia serif, letter-size, UniMate header) |
| `web/package.json` | modify — `@react-pdf/renderer` + fonts dep |
| `.planning/6-PLAN.md` | create in plan-phase |

## Out of scope (deferred)

- Section-level regen (→ P6.1 if client asks)
- Anonymous `/sop` standalone (→ v2 SEO play)
- Server-side PDF render + signed URLs (→ P6.1 if UniMate agents need backups)
- Multi-language SOPs (Mandarin, Hindi)
- Coversheet / reference letter bundling
- SOP-to-portal upload automation

## Verification (end-to-end, proved in plan-phase wave 7)

1. Migration 010 applies clean; `sop_drafts` table + RLS + service-role grants verified.
2. `/sop/[leadToken]` loads with a real lead row; auto-populates academic + preferences.
3. Generate button produces a 350–450 word SOP grounded in the lead's actual fields.
4. Regenerate creates a new `sop_drafts` row with `parent_draft_id` set + `version_number` incremented.
5. Download button triggers client-side react-pdf render → `Student_SOP_v{N}.pdf` saves locally.
6. MARA forbidden phrase in output → cumulative-buffer post-filter intercepts, deflection replaces draft, `mara_deflections` row logged.
7. 11 rapid regen clicks → rate-limit 429 with `/consult` CTA.
8. `pnpm build` passes; `mara-grep-gate.yml` passes on push.
9. Gideon single-seat `gpt-5.4` phase-verify → PASS-WITH-NOTES max, zero push-blockers (Rule 11).

## Open questions flagged for plan-phase (not blockers)

- Font strategy: bundle Georgia via `@react-pdf/font` vs rely on PDF default serif (Times). Bundle adds ~80KB but looks better.
- Draft auto-save interval vs explicit "Save" button — affects regenerate friction.
- Whether to render the PDF in a preview pane while the user edits, or only at download time (memory guard decision).

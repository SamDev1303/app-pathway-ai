# P6 — SOP Generator + PDF Export — PLAN

**Phase:** P6
**Plan date:** 2026-04-21 (Koda s51)
**Context:** `.planning/6-CONTEXT.md` (D1–D4 locked)
**Inherits:** P5/P5.1 patterns (service-role, deflection, rate-limit, staged prompt module)

---

## Goal

Replace demo SOP (`/api/sop/route.ts` — 4-field form, plain-text, no persistence) with a lead-gated, versioned, streaming, MARA-safe SOP generator with client-side react-pdf export.

## Current-state facts

- `/matches/[token]` already implements lead-token-gated server component (service-role + `leads.match_token` uuid + Zod parse of `leads.matches` jsonb). P6 mirrors exactly.
- `leads.match_token uuid UNIQUE`, `leads.matches jsonb` exist (migration 003).
- Current `/api/sop/route.ts`: `openai/gpt-oss-120b:free` + temp 0.7 + non-streaming `generateText` → `{ draft }`. System prompt is already MARA-safe → lift verbatim.
- `@react-pdf/renderer` NOT installed. No `web/public/fonts/`.
- P5.1 reuse assets: `@/lib/chat-deflection` (`scanForDeflection`), `@/lib/ratelimit`, `@/lib/chat-system-prompt` (module shape), service-role client helper.
- `.github/workflows/mara-grep-gate.yml:64` already allowlists `web/src/app/api/sop/route.ts`.

## Decisions (from 6-CONTEXT.md)

- **D1** new `sop_drafts` table (service-role RLS, self-FK version tree)
- **D2** whole-doc regen only in v1
- **D3** entry = `/sop/[leadToken]` only
- **D4** client-side react-pdf, no server PDF endpoint

Inherited: `SOP_MODEL` env (default `qwen/qwen3-next-80b-a3b-instruct:free`, temp 0.7); reuse `scanForDeflection`; `@/lib/ratelimit` key prefix `atlas:sop:*`; MARA post-filter identical to P5.1.

---

## Waves

### Wave 0 — Schema migration 010

**File:** `supabase/migrations/010_sop_drafts.sql` (create)

```sql
CREATE TABLE IF NOT EXISTS sop_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  parent_draft_id uuid REFERENCES sop_drafts(id) ON DELETE SET NULL,
  version_number int NOT NULL,
  full_text text NOT NULL,
  sections jsonb,
  model text NOT NULL,
  edited_from_section text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sop_drafts_lead ON sop_drafts(lead_id, created_at DESC);
ALTER TABLE sop_drafts ENABLE ROW LEVEL SECURITY;
-- service-role only; no anon/auth policies
```

Mirror migration 007 idempotent pattern.

**Commit:** `feat(phase-6): wave 0 — migration 010_sop_drafts schema`

### Wave 1 — Staged prompt module

**File:** `web/src/lib/sop-prompt.ts` (create)

Exports:
- `SOP_SYSTEM_PROMPT_VERSION = "2026-04-21.v1"`
- `SOP_SYSTEM_PROMPT_V1` — lift inline prompt from `/api/sop/route.ts` verbatim
- `SOP_PER_TURN_FOOTER = "Educational SOP draft — not migration advice. For binding advice consult a MARA-registered agent."`

Mirror `chat-system-prompt.ts` module shape.

**Also in Wave 1 (plan-check fold-in):** extend `.github/workflows/mara-grep-gate.yml:64` allowlist regex from `chat-system-prompt\.ts` → `(chat-system-prompt|sop-prompt)\.ts`. Otherwise the gate deterministically fires on the lifted forbidden-phrase block.

**Commit:** `feat(phase-6): wave 1 — sop-prompt.ts staging module + mara-grep-gate allowlist`

### Wave 2 — `/api/sop/route.ts` rebuild

**File:** `web/src/app/api/sop/route.ts` (rewrite)

- Input: `{ leadToken: string, selectedUniId?: string, selectedCourseName?: string, parentDraftId?: string }`
- Service-role resolves `leads` by `match_token`. Pulls profile + `matches` jsonb.
- Default target = `matches.strong[0]` if not supplied.
- Pre-filter: scan lead's `notes` for forbidden migration phrases → refuse with "Your notes mention visa content — please remove; SOPs must be academic only" (422).
- Rate-limit: `checkSopRateLimit({ ip, leadId })` (new export in `@/lib/ratelimit` — per-lead 10/day, per-IP 5/hr, global 100/day). 429 → `/consult` CTA.
- Model: `streamText` (upgrade from `generateText`). `pickSopModel()` mirrors P5.1.
- System prompt: `SOP_SYSTEM_PROMPT_V1`.
- User prompt: structured `<lead>...</lead><target>uni=X course=Y</target>` block.
- Post-filter: `experimental_transform` cumulative-buffer `scanForDeflection`. Hit → swap to deflection + insert `mara_deflections` row (`session_id = null`).
- `onFinish`: insert `sop_drafts` row. `version_number = MAX(version_number WHERE lead_id=...) + 1`.
- Returns stream + messageMetadata `{ draftId, versionNumber, deflected }`.

**Commit:** `feat(phase-6): wave 2 — /api/sop rebuild off leads + streaming + persistence + deflection + rate-limit`

### Wave 3 — react-pdf + template

- **Context7 gate (plan-check fold-in):** run `mcp__context7__query-docs` on `/diegomura/react-pdf` (or equivalent) for current version + API surface BEFORE `pnpm add`. Required by universal Context7 enforcing hook.
- `pnpm add @react-pdf/renderer` in `web/`
- `web/src/components/sop/SopPdfDoc.tsx` (create, `"use client"`). `<Document>` → `<Page size="LETTER">` → 4 `<View>` paragraph blocks (split on `\n\n`). Built-in Times serif (Georgia bundle deferred to P6.1). Header: "Statement of Purpose — {student_full_name}" + "UniMate Pty Ltd · {date}". Footer: `SOP_PER_TURN_FOOTER` on every page.

**Commit:** `feat(phase-6): wave 3 — @react-pdf/renderer + SopPdfDoc template`

### Wave 4 — `/sop/[leadToken]` surface + editor

- `web/src/app/sop/[leadToken]/page.tsx` (create). Server component mirroring `/matches/[token]/page.tsx`. Resolves lead via service-role + `match_token`. Loads latest `sop_drafts` row. Renders `<SopEditor lead={...} initialDraft={...} />` inside `<Suspense>` (Next 16 Cache Components requirement).
- `web/src/app/sop/[leadToken]/SopEditor.tsx` (create, client). State: currentText, versionHistory, selectedMatch, streamingStatus.
  - Match picker `<select>` from `lead.matches.strong[] + stretch[]`, defaults `strong[0]`.
  - Generate/Regenerate → POST `/api/sop` with `{ leadToken, selectedUniId, selectedCourseName, parentDraftId }`. Fetch + `ReadableStream` reader (not `useChat`).
  - Live streaming display.
  - Version history sidebar: `v{N}` + timestamp. Click → read-only preview + "Restore as v(N+1)" (re-POST w/ old text as parent).
  - Download PDF: dynamic-import `SopPdfDoc`, `pdf(<SopPdfDoc …/>).toBlob()` → `saveAs(blob, 'Student_SOP_v{N}.pdf')`.
  - Banners: deflected / rate-limited (429 + `/consult`) / invalid-token.

**Commit:** `feat(phase-6): wave 4 — /sop/[leadToken] entry + editor client + PDF download`

### Wave 5 — Cross-link

- Modify `web/src/app/matches/[token]/page.tsx` — add "Draft your SOP →" CTA → `/sop/[same-token]`.

**Commit:** `feat(phase-6): wave 5 — /matches → /sop cross-link`

### Wave 6 — Verify + MARA gate + build

- Add `web/src/lib/sop-prompt.ts` to `mara-grep-gate.yml:64` allowlist if needed (mirror `chat-system-prompt.ts`).
- Smoke (Supabase + OPENROUTER keys required):
  1. Seed test lead with `match_token` + realistic `matches` jsonb.
  2. `/sop/[leadToken]` loads, picker shows strong[0].
  3. Generate → 400-word SOP streams in.
  4. `select * from sop_drafts where lead_id = X` → v1 row.
  5. Regenerate → v2 row, `parent_draft_id = v1.id`.
  6. Download → `Student_SOP_v2.pdf` opens clean.
  7. Force migration phrase in notes → 422 pre-filter refusal.
  8. 11 rapid regens → 429 + `/consult`.
  9. `pnpm build` passes. `mara-grep-gate` passes.

**Commit:** `feat(phase-6): wave 6 — verify + MARA gate clean`

### Wave 7 — Phase-verify + STATE sync

- Dispatch Gideon single-seat `gpt-5.4`, 4-persona contract (MARA Compliance / Security-Privacy / AI SDK Integrator / Production Readiness). Zero push-blockers required (Rule 11).
- Update `.planning/STATE.md` (P6 → done).

**Commit:** `feat(phase-6): wave 7 — phase-verify sign-off + STATE.md sync`

---

## Critical files

| File | Action |
|---|---|
| `supabase/migrations/010_sop_drafts.sql` | create |
| `web/src/lib/sop-prompt.ts` | create |
| `web/src/app/api/sop/route.ts` | rewrite |
| `web/src/components/sop/SopPdfDoc.tsx` | create |
| `web/src/app/sop/[leadToken]/page.tsx` | create |
| `web/src/app/sop/[leadToken]/SopEditor.tsx` | create |
| `web/src/app/matches/[token]/page.tsx` | modify (SOP CTA) |
| `web/package.json` | add `@react-pdf/renderer` |
| `web/src/lib/ratelimit.ts` | add `checkSopRateLimit` |
| `.github/workflows/mara-grep-gate.yml` | allowlist if needed |

## Out of scope (→ P6.1/v2)

Section-level regen; server-side PDF; anonymous `/sop`; multi-language; Georgia font bundle; coversheets; auto-save; live preview pane.

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| `leads.matches` empty | Show "Complete your match first" CTA; 422 on empty matches array |
| `@react-pdf/renderer` bundle bloat | Dynamic-import SopPdfDoc client-only |
| Qwen3 rate-ceiling under heavier SOP tokens | Per-lead 10/day cap; global 100/day SOP separate from chat |
| Post-filter mis-flags lead's own "visa" note | Pre-filter scans USER input BEFORE send; explicit 422 |
| Version-tree UX confusion | `v{N}` + timestamp labels; "Restore as v(N+1)" = new row (non-destructive) |
| Next 16 Cache Components forbids `force-dynamic` | `<Suspense>` wrap editor, like P5 `/chat` |

## Verification

1. Migration 010 applies idempotent; re-run = no-op.
2. `/sop/[leadToken]` loads with real lead; picker populated.
3. SOP streams 350–450 words grounded in lead profile + selected match.
4. Each generate = new `sop_drafts` row; `parent_draft_id` set on regen; versions monotonic per lead.
5. Download saves proper serif-letter PDF with header/footer.
6. Forced migration phrase → deflection mid-stream + `mara_deflections` logged.
7. 11th regen → 429 + `/consult`.
8. `/matches/[token]` → `/sop/[same-token]` CTA works.
9. `pnpm build` passes; mara-grep-gate passes.
10. Gideon phase-verify: zero push-blockers.

## Review protocol

- **Plan-check:** `gsd-plan-checker` BEFORE wave 0. Iterate to APPROVE / APPROVE-WITH-NOTES.
- **Phase-verify:** after wave 6, Gideon single-seat `gpt-5.4`, 4 personas, zero push-blockers.
- **Commit cadence:** one atomic commit per wave, `feat(phase-6):` prefix, pushed to atlas-ai.

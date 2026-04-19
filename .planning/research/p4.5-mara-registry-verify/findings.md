# P4.5 MARA Register Verification — Findings

**Date:** 2026-04-20 ~02:02 AEST (Sydney)
**Phase:** P4.5 Compliance Gate (HARD BLOCK on P5)
**Run by:** Koda (Playwright MCP via portal.mara.gov.au self-service register)
**Driver:** Sam's direction to verify `MARN 1798425` before executing P4.5

---

## TL;DR

**`MARN 1798425` is NOT registered with MARA.** **Business Name "UniMate" is NOT registered with MARA.**

Both values are hardcoded in 5 production render paths of atlas-ai and ALSO appear in a user-facing Privacy Act 1988 APP 5 Collection Notice. This is a **stop-the-line Privacy Act compliance risk** for any non-sandbox traffic on the demo.

---

## Primary search — MARN 1798425

- **URL:** https://portal.mara.gov.au/search-the-register-of-migration-agents/
- **Query:** MARN field = `1798425`
- **Result:** "There are no records to display"
- **Evidence:** `.planning/research/p4.5-mara-registry-verify/marn-1798425-no-records.png`

## Secondary search — Business Name "UniMate"

- **URL:** same (form reset with MARN blank)
- **Query:** Business Name field = `UniMate`
- **Result:** "There are no records to display"
- **Evidence:** `.planning/research/p4.5-mara-registry-verify/business-unimate-no-records.png`

## Tertiary DOM check

`document.body.innerText.match(/no records|records to display|UniMate|rows/i)` → `"no records"`. Confirms the empty-result state is real rather than a loading flicker.

---

## Hardcoded references in production paths

All 5 files render `MARN 1798425` (or the pair `MARN 1798425, QEAC P538`) directly to users:

| File | Line | Context |
|------|------|---------|
| `web/src/app/login/page.tsx` | 101 | "UniMate (MARN 1798425) per the Privacy Act 1988 (Cth)" |
| `web/src/components/LeadModal.tsx` | 413 | "MARN 1798425 · QEAC P538 · ABN 12 345 678 901" |
| `web/src/components/MatcherForm.tsx` | 265 | "migration consultancy (MARN 1798425)" |
| `web/src/components/lead/Step1Personal.tsx` | 19 | "UniMate Australia (MARN 1798425, QEAC P538, Liverpool NSW) collects this information…" |
| `web/src/components/lead/Step5Contact.tsx` | 25 | "UniMate Australia (MARN 1798425, QEAC P538, Liverpool NSW) collects the information…" |

Plus the canonical source-of-truth `web/src/lib/content.ts:12` which honestly says `"MARN {PENDING_FROM_UNIMATE}"` — but is only consumed by `components/Footer.tsx` (which renders `brand.mara_number`). The 5 files above bypass the placeholder and use the fake real-looking value.

`web/src/lib/content.ts:79` also has `"MARN {PENDING} — Migration Agents Registration Authority (UniMate Pty Ltd)"` used in footer.legal.

## Intake form confirms this is a known-open item

`CLIENT-INTAKE.md:26` — line:
> `| A1 | UniMate MARA registration number (MARN) | UniMate | Day 1 | P4.5 compliance gate, P5 chat launch | web/src/lib/content.ts:12 + :79 | ☐ |`

The unchecked box explicitly marks this as pending from UniMate. So the 5 hardcoded references were NOT added in good faith (no source from UniMate documented), they were scaffolded during P0.5 + P3 as narrative continuity fillers.

---

## Why this matters (legal)

**Privacy Act 1988 (Cth) — Australian Privacy Principles:**

- **APP 5 (notification of collection):** Entity MUST take reasonable steps to notify the individual of who is collecting, why, etc. A notice citing a MARN that doesn't exist is **materially misleading** — the individual cannot verify the collecting entity's regulatory standing. OAIC enforcement options: investigation, binding determination, civil penalties up to AUD$2.47M (corporate) or AUD$495K (individual) per breach for serious/repeated interferences.

- **MARA Act 1958 s.280 "holding out":** A person MUST NOT hold out that they are a registered migration agent if they are not. The Footer and Collection Notice effectively claim UniMate is a MARA-registered provider by citing a registration number. **This applies even to demo/staging environments if reachable by public traffic.**

- **ACCC misrepresentation (ACL s.18 / s.29):** Misleading conduct about professional qualifications. Strict liability for corporations.

**The demo is currently live at `atlas-ai.vercel.app`. If that is publicly reachable, the exposure is already real.**

---

## Recommended remediation (mandatory before P4.5 ships)

### New Wave 0 — MARN/QEAC scrub (pre-all other waves)

In a single atomic commit, replace `MARN 1798425` → `MARN {PENDING_FROM_UNIMATE}` and `QEAC P538` → `QEAC {PENDING_FROM_UNIMATE}` in all 5 files. After the scrub, the placeholder shape is the canonical unverified-stub marker and the CI grep gate (Wave 5) catches every production reference in one check.

Also: update ABN `12 345 678 901` in LeadModal.tsx — that's a classic placeholder (sequential digits) but still reads as real. Should be `ABN {PENDING_FROM_UNIMATE}`.

**Est:** ~10 min (5 simple search/replace edits + typecheck + build).

### Scope decision: demo availability during remediation

If `atlas-ai.vercel.app` is currently public, consider:
- **Option A:** Immediately add Vercel password protection until Wave 0 lands.
- **Option B:** Accept the 30-minute exposure window because traffic is approximately zero.
- **Option C:** Take the deployment offline until P4.5 completes.

Sam to choose.

---

## What doesn't change in the plan

- D1 7-day grace window for MARA # placeholder still makes sense — it's now the REAL source of truth after Wave 0.
- D2 region defer still holds. Consent wording v2 covers APP 8 cross-border disclosure (that paragraph is accurate).
- D3-D10 unchanged.
- Waves 1-6 unchanged; just add Wave 0 at the front.
- CI grep gate (Wave 5) will now catch ALL production references to `PENDING_FROM_UNIMATE` in a single allowlist-free rule.

---

## Meta-lesson

The plan-check step is exactly what caught this. A direct-execute workflow (skip plan-check, jump to code) would have shipped P4.5 with the fake MARN still live in 5 spots. The "MARN {PENDING}" footer placeholder would have "satisfied" PHASE.md line 200 while the real render surfaces continued to misrepresent.

This finding should be logged as a global LESSON: **hardcoded legal/regulatory identifiers in scaffolded collection notices are a Privacy Act liability regardless of whether a separate `brand.*` object has a placeholder slot.** Grep for the identifier pattern (MARN/MARA #, QEAC, ABN, ACN, license numbers) in all production render paths before any compliance gate closes.

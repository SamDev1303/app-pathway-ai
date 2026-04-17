# Atlas AI — Client Intake

**Prepared for:** UniMate Pty Ltd — Karna Banti
**Prepared by:** Koda Labs — sam@claudeking.org
**Date:** 2026-04-18
**Related docs:** `ATLAS-AI-SOW.md` (v1.1), `PRD-CLIENT.md`

---

## How to use this doc

Tick rows off as UniMate resolves each item. Each row names the **phase it blocks** — if an item is late, the work it blocks slips by the same amount. Nothing here is optional for v1 launch unless marked (optional).

Sam's side of the table is already known — this is the list of things **only UniMate can provide**. Two exceptions: the domain decision and the n8n activation decision are joint calls.

All deadlines are expressed as **days from PO signature** (PO = the day deposit clears).

---

## A. Legal & Compliance

These rows block the Phase 4.5 **compliance gate** — the gate that sits between the AI chat being *built* and the AI chat going *live*. Without these, no real traffic can touch Atlas AI.

| # | Item | Owner | Deadline | Blocks | Where it lands in code | Status |
|---|---|---|---|---|---|---|
| A1 | UniMate MARA registration number (MARN) | UniMate | Day 1 | P4.5 compliance gate, P5 chat launch | `web/src/lib/content.ts:12` + `:79` | ☐ |
| A2 | UniMate QEAC counsellor number | UniMate | Day 1 | P4.5 compliance gate | `web/src/lib/content.ts:13` + `:80` | ☐ |
| A3 | Legal entity name (for contract + footer) | UniMate | Day 0 | Contract signing, site footer | `web/src/lib/content.ts:78` | ☐ |
| A4 | ABN (currently placeholder `12 345 678 901`) | UniMate | Day 1 | P4.5 compliance gate | `web/src/lib/content.ts:78` | ☐ |
| A5 | UniMate business phone (public) | UniMate | Day 2 | P3 lead modal contact block | `web/src/lib/content.ts:15` | ☐ |
| A6 | Counsellor contact email (for lead notifications + footer) | UniMate | Day 2 | P3 lead-capture notification | `web/src/lib/content.ts:14` (if changing from `hello@atlasai.com.au`) | ☐ |
| A7 | Privacy policy URL (or Koda drafts template) | UniMate | Day 3 | P4.5 compliance gate | Lead modal APP 5 notice footer link | ☐ |
| A8 | APP 8 cross-border disclosure accepted (Singapore Supabase) | UniMate | Day 2 | P4.5 compliance gate | Already wired in P3 lead modal; needs UniMate written acknowledgement — see §D3 | ☐ |
| A9 | Right-of-correction / deletion SOP (`privacy@unimate.com.au` escalation) | UniMate | Day 5 | P4.5 compliance gate | N/A (UniMate-internal process doc) | ☐ |

---

## B. Brand assets

These block Phase 0.5 scaffold finalisation and Phase 7 mobile-app rebrand. Atlas AI currently ships with placeholder type-marks.

| # | Item | Owner | Deadline | Blocks | Status |
|---|---|---|---|---|---|
| B1 | Logo — SVG (primary, for web) | UniMate | Day 3 | P0.5 scaffold finalisation, P2 header/footer | ☐ |
| B2 | Logo — PNG @ 512×512 + 1024×1024 (for mobile icon + social) | UniMate | Day 3 | P7 mobile rebrand | ☐ |
| B3 | Brand colour palette (primary + accent hex codes) | UniMate | Day 3 | P2 header/footer, P6 landing polish | ☐ |
| B4 | Font preference (serif / sans / specific family?) — or Koda picks | UniMate | Day 5 | P6 landing polish | ☐ |
| B5 | Counsellor photos + bios (optional, v2) | UniMate | v2 only | Not blocking v1 | ☐ |

**Koda's default if UniMate skips any:** use the current Atlas AI design tokens (navy + warm-cream palette, Georgia serif for headings). UniMate can re-skin in v2.

---

## C. University data seed

Phase 4 (UniMatch engine) and Phase 5 (AI chat) both pull from the same university + course seed. Without UniMate's preferred shortlist, Koda uses a generic top-43 from CRICOS open data — works fine but may miss partner unis UniMate wants surfaced first.

| # | Item | Owner | Deadline | Blocks | Status |
|---|---|---|---|---|---|
| C1 | Top-10 preferred universities (surfaced first in matching) | UniMate | Day 5 | P4 matcher tuning | ☐ |
| C2 | CRICOS course codes for UniMate's key courses (currently 48 rows are NULL) | UniMate (or Koda sources from public data) | Day 7 | P4 match accuracy, P5 chat grounding | ☐ |
| C3 | Any "do NOT surface" universities (competitor carve-outs) | UniMate | Day 5 | P4 matcher filter | ☐ |

**Koda's fallback:** if C1–C3 are not supplied by Day 7, Koda uses CRICOS open data for all 43 unis and surfaces them by QS WUR rank. This is the default and ships on time.

---

## D. Hosting & domain decisions

These are **joint decisions** — Sam and UniMate must both agree. Defaults are written in case UniMate defers.

| # | Item | Owner | Deadline | Blocks | Default if no decision | Status |
|---|---|---|---|---|---|---|
| D1 | Domain choice: `atlas-ai.vercel.app` (free) vs `atlasai.com.au` (UniMate registers + points DNS) | Both | Day 3 | P9 deploy | `atlas-ai.vercel.app` for launch; migrate later at zero cost | ☐ |
| D2 | n8n lead-sync activation ($200 add-on, UniMate-owned Hostinger VPS) — YES or SKIP | Both | Day 5 | Post-launch optional | **SKIP v1** — DB + Resend email already capture every lead; UniMate can re-order later | ☐ |
| D3 | Supabase region: Singapore (`ap-southeast-1`) — written acknowledgement of cross-border disclosure | UniMate | Day 2 | P4.5 compliance gate | N/A — this one needs explicit sign-off; no default | ☐ |
| D4 | Vercel account ownership: Koda-hosted during build → transfer to UniMate on acceptance | Both | On final payment | P9 handover | Transfer on final 50% clearance | ☐ |
| D5 | Supabase project ownership: transfer service-role key + billing on acceptance | Both | On final payment | P9 handover | Transfer on final 50% clearance | ☐ |

**Note on D3:** The lead-capture modal already discloses Singapore hosting per APP 8 — Koda added this at Phase 3 after the Supabase region deviation. UniMate's sign-off here is the **business-side** acknowledgement; the **technical disclosure to the end user** is already shipped.

**Note on D2 pricing (if UniMate picks YES):** $200 one-time covers Koda's labour to install n8n on UniMate's Hostinger VPS, configure the Google Workspace + Supabase credentials, import the workflow JSON that already ships at `ops/n8n/lead-sync-workflow.json`, and run a smoke test. Hostinger VPS ($5–20/mo) and Google Workspace access are UniMate's cost. See SOW §1 line 2.

---

## E. Ops channels

| # | Item | Owner | Deadline | Blocks | Status |
|---|---|---|---|---|---|
| E1 | UniMate ops inbox for lead notifications (can be `leads@unimate.com.au` or a Karna's personal address (bhantikaran@gmail.com)) | UniMate | Day 3 | P3 lead-capture email flow | ☐ |
| E2 | Resend sender domain — default `noreply@resend.dev` or UniMate provides `noreply@unimate.com.au` + DNS TXT for DKIM | UniMate (optional) | Day 5 | P3 email deliverability | ☐ |
| E3 | Named compliance sign-off contact (MARA-registered agent on UniMate side) | UniMate | Day 5 | P4.5 compliance gate | ☐ |
| E4 | Named technical contact for SSH/DNS if UniMate owns the domain | UniMate | Day 3 (only if D1 = custom) | P9 deploy | ☐ |

---

## F. Payment & acceptance

Fixed-price contract. See `ATLAS-AI-SOW.md` v1.1 §5 for full terms.

| # | Item | Owner | Deadline | Blocks | Status |
|---|---|---|---|---|---|
| F1 | PO confirmation (signed SOW v1.1 via Square contract) | UniMate | Day 0 | Build start (P4 onwards) | ☐ |
| F2 | Deposit 50% ($1,600 AUD) clears in Koda Labs bank account | UniMate | Day 0 | P4 build start | ☐ |
| F3 | UAT acceptance — 7-day window after build complete | UniMate | Day 14 (7 + 7) | Final payment | ☐ |
| F4 | Final payment 50% ($1,600 AUD) | UniMate | Day 14 (or written acceptance, first) | Ownership transfer | ☐ |

**Deposit includes:** the one-time $200 n8n activation fee if D2 = YES (total = $1,700 deposit instead of $1,600). Defaults to $1,600 if D2 = SKIP.

---

## G. UAT pass criteria (joint sign-off)

Koda proposes the below; UniMate can amend any row before signing the SOW. Each row is a binary PASS/FAIL — all must PASS for final acceptance.

| # | Criterion | How it's tested |
|---|---|---|
| G1 | Lead captured end-to-end | Submit seeded test lead → lead appears in Supabase `leads` + arrives at UniMate ops inbox within 60s |
| G2 | MARA-safe chat | 10 test queries including explicit visa/PR/subclass-500 questions → zero migration-advice strings in the 10 responses |
| G3 | UniMatch returns ≥3 results | Sample student profile (undergrad IT, $40k/yr budget, NSW preference) returns 3+ CRICOS-registered matches with reason strings |
| G4 | SOP generator outputs valid PDF | Draft → edit → regenerate → download. PDF opens in Chrome + Safari + Acrobat. |
| G5 | Mobile app opens with Atlas AI branding | Expo build installs on a test Android/iOS device, launches, shows Atlas AI name + logo |
| G6 | Production URL live | `atlas-ai.vercel.app` (or custom) returns 200 on `/`, `/api/match`, `/api/chat` |
| G7 | Compliance attestation signed by Koda reviewers (Gideon + Neo/Specter) | Attestation doc delivered at handover |

---

## H. Out of scope (explicit — for UniMate reference)

Per SOW v1.1 §2. These are priced separately in v2 and **will not** appear in v1 even if requested during UAT. Re-opening any of these requires a new PO.

1. Admin Dashboard (roles-based CRM) — v2 quote $2–3k
2. Provider Dashboard (university partner view) — v2 quote $3–4k
3. Course-scraping automation — v2 quote $2k (pending legal review)
4. Analytics dashboard beyond Vercel Analytics — v2 quote $1–2k
5. Better Auth migration from Supabase magic link — v2 quote $1k
6. `internal_user_id` abstraction layer (multi-vendor portability) — v2 quote $1k

---

## I. Summary — what UniMate needs to send Sam

Minimum to unblock Phase 4 build start:

1. Signed Square contract (F1)
2. Deposit cleared (F2)
3. MARN + QEAC numbers (A1, A2)
4. Legal entity name + ABN (A3, A4)
5. APP 8 written acknowledgement (A8 + D3)

Everything else can trickle in during the 7-day build window. Items with later deadlines have soft defaults so build start is never gated on brand assets or uni shortlists.

---

**Questions?** Email sam@claudeking.org or Telegram directly.

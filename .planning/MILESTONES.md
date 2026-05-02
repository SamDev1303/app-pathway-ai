# Pathway-AI Milestones

## v1.0 — Production launch (shipped 2026-04-21, rebranded 2026-05-02)

**Goal:** Ship 4 conversion-critical modules for Australian study-abroad advisory.

**Shipped:**
- AI Advisor Chat (gpt-4o-mini, RAG-grounded, compliance-deflecting)
- 5-Step Lead Capture (Privacy Act 1988 (Cth) compliant, service+marketing consent split)
- UniMatch Engine (CRICOS + QS WUR, 17 universities seeded — expanding to 43)
- SOP Generator (react-pdf, edit+regenerate loop)
- Companion Expo SDK 54 mobile app (mockData only — not RPC-wired)
- Supabase Postgres + pgvector + RLS, n8n lead-sync workflow (dormant)

**Phases:** P0–P6 (scaffold, governance, Supabase seed, lead-capture UI, matcher, chat, observability, SOP).

**Re-scoped to v2 (deferred):** Admin Dashboard, Provider Dashboard, Course Scraper, Analytics Dashboard, Better Auth, internal_user_id abstraction. See `_reference/v1-research-summary.md` for unlock conditions.

**Rebrand (2026-05-02):** Project renamed Atlas AI (working title) → Pathway-AI. All client-identity and registered-migration-consultancy framing stripped. Pathway-AI is now operated as Koda Labs' own SaaS product, not client work. Commits `101980d`, `15ac21b`, `54022b5`, `87499a3`.

---

## v2.0 — First-Customer Activation (started 2026-05-02)

**Goal:** Get to one paying customer or one signed pilot. Pathway-AI v1 is shipped and clean — but has no paying users. v2 is NOT about building more modules from the deferred-table; it's about validating that what's built earns revenue.

**Theme:** distribution + lead-magnet + close, not feature expansion.

**Phases:** P7 (mobile RPC wire-up) → P8 (data quality + 43-uni backfill) → P9 (marketing surface + lead-magnet) → P10 (outreach + first close).

See `ROADMAP.md` for phase detail.

# Pathway-AI v2.0 Roadmap

**Milestone:** v2.0 First-Customer Activation
**Phases:** P7 → P10 (continuing numbering from v1.0 which ended at P6)
**Theme:** Validate v1 earns revenue before building more modules.

---

## Phase index

| # | Phase | Goal | Requirements | Success criteria |
|---|---|---|---|---|
| P7 | Mobile RPC wire-up | Mobile reaches feature parity with web on the live backend | MOBILE-01..04 | 4 |
| P8 | Data quality + 43-uni backfill | Pathway-AI returns matches against the full AU university surface, not the 17-uni demo set | DATA-01..03 | 3 |
| P9 | Marketing surface + lead-magnet | One landing page + one gated artifact start producing inbound leads | MKT-01..04 | 4 |
| P10 | First close | At least one paying customer or signed pilot, with billing wired | ACQ-01..04 | 4 |

---

## Phase P7: Mobile RPC wire-up

**Goal:** The Expo app stops using mockData and talks to the live `/api/*` endpoints + `match_unis_for_lead` RPC. After P7, mobile and web have the same conversion surface.

**Requirements:** MOBILE-01, MOBILE-02, MOBILE-03, MOBILE-04

**Success criteria:**
1. Mobile chat returns a real RAG-grounded response from the production `/api/chat` endpoint within 5s
2. Mobile match tab takes a student profile and returns ≥3 ranked CRICOS-registered matches from `match_unis_for_lead`
3. Mobile lead-capture creates a row in `leads` and persists `match_token` for navigation back into matches
4. Switching between local and production API base requires only an env var change (no code edit)

**Build notes:**
- API base already env-prepped from rebrand commit `54022b5` (`EXPO_PUBLIC_API_BASE` not yet wired — finish in P7)
- Sentry already in mobile, route errors through existing instrumentation
- Apple Dev account NOT a P7 dependency — P7 ships Android + Expo Go only

---

## Phase P8: Data quality + 43-uni backfill

**Goal:** Pathway-AI's matching engine ranks against the full Group of Eight + regional + selected private AU surface, not the 17-uni demo set.

**Requirements:** DATA-01, DATA-02, DATA-03

**Success criteria:**
1. `universities` table has 43 rows, all with non-null CRICOS provider codes
2. `courses.cricos_code` has 0 NULL rows after backfill (was 48 NULLs at v1 close)
3. Re-embedded courses round-trip through `/api/chat` and surface in RAG hits within similarity threshold

**Build notes:**
- Source: public CRICOS register (`cricos.education.gov.au`) — open government data
- Sequence: insert universities first → backfill courses → re-embed
- Each batch is idempotent (UPSERT on natural key)

---

## Phase P9: Marketing surface + lead-magnet

**Goal:** One signal page that converts an organic visitor into a `leads` row. Without this, Pathway-AI has no path to its first inbound prospect.

**Requirements:** MKT-01, MKT-02, MKT-03, MKT-04

**Success criteria:**
1. `pathway-ai.vercel.app` renders the new landing within 1.5s LCP on mobile (Vercel Analytics)
2. The matcher embed on the landing converts on a real test profile (returns matches + opens lead modal)
3. Email-gated PDF lead-magnet captures a row in `leads` with `source: 'lead-magnet'`
4. Sitemap + robots are crawlable and OG image renders in a Slack/LinkedIn link preview

**Build notes:**
- The matcher already exists; embed it via existing `<MatcherForm />` component
- Lead-magnet PDF can use react-pdf (already installed for SOP) — avoid new deps
- Consider SSG via Next.js static rendering for SEO; the matcher can hydrate client-side

---

## Phase P10: First close

**Goal:** One paying customer OR one signed pilot with billing wired. This is the unlock condition for any further deferred-module work.

**Requirements:** ACQ-01, ACQ-02, ACQ-03, ACQ-04

**Success criteria:**
1. 30-prospect outreach list enriched and stored in CRM (re-use existing CRM enrichment pipeline)
2. ≥10 of 30 receive personalized cold-email + LinkedIn-DM
3. ≥3 demo bookings with live UniMatch + chat run against their actual student profile
4. ≥1 closed deal (Stripe payment cleared OR signed pilot agreement) — this is the milestone exit gate

**Build notes:**
- Use existing `outreach-email` skill + GWS/Gmail accounts (krishnashamal143 for outreach)
- Pricing TBD in P10 discuss-phase — likely $99/mo per agent OR $499/mo per agency
- Stripe wiring: minimal Checkout link is enough; full subscription mgmt waits until 5+ paying customers

---

## After v2.0

If P10 closes the milestone exit gate (1+ paying or signed), v2.1 picks the next module from the deferred table whose unlock condition is now met. Most likely candidates:
- **Admin Dashboard** if the closed deal is an agency with ≥2 reps
- **Provider Dashboard** if the closed deal is a university partner
- **Analytics Dashboard** if Vercel + Supabase visibility hits a wall during P9-P10

If P10 fails to close, v2.0 extends with a P11 retro+pivot phase rather than building more product.

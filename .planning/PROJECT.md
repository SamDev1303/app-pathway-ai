# PROJECT.md — Pathway-AI (GSD meta)

This file satisfies the GSD `.planning/` scaffold requirement. Canonical content lives at the project root; this is a pointer-only doc.

| Meta | Value |
|---|---|
| Project | Pathway-AI |
| Owner | Koda Labs (own SaaS product) |
| Product type | AI study-abroad advisor for Australian universities — Next.js web + Expo mobile |
| Status | v1 shipped 2026-04 (under former working title `Atlas AI`); rebranded to Pathway-AI 2026-05-02; v2 scope TBD |
| Requirements | → [`../PRD.md`](../PRD.md) |
| v1 research summary | → [`../_reference/v1-research-summary.md`](../_reference/v1-research-summary.md) |
| Roadmap | → [`../PHASE.md`](../PHASE.md) |
| Architecture | → [`../SOURCECODE.md`](../SOURCECODE.md) |
| Governance | → [`../CLAUDE.md`](../CLAUDE.md) |
| Config | → [`./config.json`](./config.json) |
| State | → [`./STATE.md`](./STATE.md) |
| Research (per phase) | → `./research/` |

**Do not duplicate content from the root docs into this file.** If PRD or PHASE changes, those are authoritative — do not sync a copy here.

GSD `/gsd-*` commands that operate on `.planning/` should treat root `PHASE.md` as the roadmap source and root `PRD.md` as the requirements source.

## Current Milestone: v2.0 First-Customer Activation

**Goal:** Validate that v1 earns revenue before building more modules. Get to one paying customer or one signed pilot.

**Target features:**
- Mobile app wired to live backend (parity with web)
- Data quality: 43-uni surface + zero NULL CRICOS course codes
- Marketing landing + lead-magnet (one inbound conversion path)
- 30-prospect outreach + first close

See `.planning/ROADMAP.md` for phases P7–P10.

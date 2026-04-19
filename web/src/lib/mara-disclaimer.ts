// web/src/lib/mara-disclaimer.ts
// P4 UniMatch — canonical MARA disclaimer strings for /matches/[token].
// Research: .planning/research/4-RESEARCH.md §"MARA Banner Wording (open item 4)"
//
// Edit rule: bumping the string requires bumping MARA_DISCLAIMER_VERSION in the
// same commit, same way CONSENT_WORDING_VERSION works in lib/lead-schema.ts.
// This prevents the "copy drift" landmine (Research §Landmines #8).

export const MARA_DISCLAIMER_VERSION = "2026-04-20.v2";

export const MARA_DISCLAIMER_BODY =
  "Atlas AI matches are educational information only, not migration advice. " +
  "For visa, migration, or PR guidance, consult UniMate's registered MARA agents.";

export const MARA_DISCLAIMER_EYEBROW = "Disclaimer";

export const MARA_CONSULT_CTA_LABEL = "Book a free consultation";
export const MARA_CONSULT_CTA_HREF = "/consult";

/**
 * Canonical link to the MARA public register — used by footer + compliance doc.
 * Any reader can verify UniMate's MARA registration status by entering the MARN
 * (source-of-truth: `brand.mara_number` in lib/content.ts) into this register.
 *
 * TODO(UniMate): replace `[PENDING_FROM_UNIMATE]` in content.ts by 2026-04-27.
 * CI grep gate `.github/workflows/mara-grep-gate.yml` enforces this after
 * the grace window closes.
 */
export const MARA_REGISTRATION_AUTHORITY_URL =
  "https://portal.mara.gov.au/search-the-register-of-migration-agents/";

export const MARA_REGISTRATION_AUTHORITY_LABEL = "Verify on the MARA register";

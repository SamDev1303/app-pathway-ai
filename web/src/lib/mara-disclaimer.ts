// web/src/lib/mara-disclaimer.ts
// P4 UniMatch — canonical MARA disclaimer strings for /matches/[token].
// Research: .planning/research/4-RESEARCH.md §"MARA Banner Wording (open item 4)"
//
// Edit rule: bumping the string requires bumping MARA_DISCLAIMER_VERSION in the
// same commit, same way CONSENT_WORDING_VERSION works in lib/lead-schema.ts.
// This prevents the "copy drift" landmine (Research §Landmines #8).

export const MARA_DISCLAIMER_VERSION = "2026-04-19.v1";

export const MARA_DISCLAIMER_BODY =
  "Atlas AI matches are educational information only, not migration advice. " +
  "For visa, migration, or PR guidance, consult UniMate's registered MARA agents.";

export const MARA_DISCLAIMER_EYEBROW = "Disclaimer";

export const MARA_CONSULT_CTA_LABEL = "Book a free consultation";
export const MARA_CONSULT_CTA_HREF = "/consult";

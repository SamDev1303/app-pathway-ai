// Atlas AI landing copy.
// MARA-safe: NO migration/visa advice claims. No PR/visa success stats.
// Client's MARA/QEAC numbers are placeholders until UniMate provides them.

export const brand = {
  name: "Atlas AI",
  tagline: "for Australian study",
  full: "Atlas AI",
  poweredBy: "Powered by UniMate Pty Ltd",
  established: "Established 2018",
  city: "Liverpool, NSW",
  mara_number: "MARN {PENDING_FROM_UNIMATE}",
  qeac_number: "QEAC {PENDING_FROM_UNIMATE}",
  email: "hello@atlasai.com.au",
  phone: "+61 2 {PENDING}",
  address: "Level 2, 99 Macquarie Street, Liverpool NSW 2170",
} as const;

export const hero = {
  eyebrow: "Chapter 01 — Your Study Match",
  headline: "Find your Australian university in",
  headlineEm: "thirty seconds.",
  subhead:
    "No signup. No forms. No waiting. Three questions, three CRICOS-registered matches from Group of Eight and regional Australian universities.",
  metadata: {
    title: "UniMate Pty Ltd — MARA-registered education consultancy",
    location: "Liverpool, NSW",
    since: "Since 2018",
  },
} as const;

export const matcherSection = {
  eyebrow: "Chapter 02 — Find Your Match",
  headline: "Three questions.",
  headline2: "Three universities.",
  headline3: "Thirty seconds.",
  subhead:
    "Powered by 40 Group of Eight and regional Australian universities. Real CRICOS-registered courses with real fees — no paid placements.",
} as const;

export const trust = {
  eyebrow: "Registered & Certified",
  tagline: "Built with a MARA-registered partner.",
  credentials: [
    {
      label: "MARA",
      number: brand.mara_number,
      caption: "Migration Agents Registration Authority (UniMate Pty Ltd)",
    },
    {
      label: "QEAC",
      number: brand.qeac_number,
      caption: "Qualified Education Agent Counsellor",
    },
    {
      label: "CRICOS",
      number: "Aligned",
      caption: "Australian Government provider register",
    },
  ],
} as const;

export const stats = [
  { value: 40, suffix: "+", label: "Australian universities" },
  { value: 117, suffix: "", label: "Flagship courses indexed" },
  { value: 30, suffix: "s", label: "Average match time" },
  { value: 2018, suffix: "", label: "Partner est." },
] as const;

export const footer = {
  cta: {
    eyebrow: "Ready to talk to a real counsellor?",
    headline: "Bring your match to UniMate's Liverpool office.",
    sub: "Walk in with your three matches. Talk to a MARA-registered agent about your options. Atlas AI is not migration advice — your UniMate counsellor is.",
    button: "Book a free consultation",
  },
  legal: [
    "© 2026 Atlas AI — powered by UniMate Pty Ltd. ABN 12 345 678 901.",
    "MARN {PENDING} — Migration Agents Registration Authority (UniMate Pty Ltd)",
    "QEAC {PENDING} — Qualified Education Agent Counsellor",
    "Atlas AI is an information and matching service. It is not migration advice. Consult a registered MARA agent for binding advice.",
  ],
} as const;

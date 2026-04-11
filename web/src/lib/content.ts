export const brand = {
  name: "UniMate",
  tagline: "Australia",
  full: "UniMate Australia",
  established: "Established 2018",
  city: "Liverpool, NSW",
  mara_number: "MARN 1798425",
  qeac_number: "QEAC P538",
  email: "hello@unimateaustralia.com",
  phone: "+61 2 8000 1234",
  address: "Level 2, 99 Macquarie Street, Liverpool NSW 2170",
} as const;

export const hero = {
  eyebrow: "Chapter 01 — Your Pathway",
  headline: "Find your Australian university in",
  headlineEm: "thirty seconds.",
  subhead:
    "No signup. No forms. No waiting. Three questions, three real matches, ranked across Group of Eight and regional universities.",
  metadata: {
    title: "MARA-licensed migration consultancy",
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
    "Powered by 40 Group of Eight and regional Australian universities. We surface real matches, real fees, real PR pathways — not paid placements.",
} as const;

export const trust = {
  eyebrow: "Registered & Certified",
  tagline: "Licensed to represent your future.",
  credentials: [
    {
      label: "MARA",
      number: brand.mara_number,
      caption: "Migration Agents Registration Authority",
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
  { value: 98, suffix: "%", label: "Student visa success rate" },
  { value: 30, suffix: "s", label: "Average match time" },
] as const;

export const footer = {
  cta: {
    eyebrow: "Ready to lodge?",
    headline: "Bring your match to the Liverpool office.",
    sub: "Walk in with your three matches. Walk out with an application plan, scholarship audit, and visa pathway. Free first consultation, MARA-licensed.",
    button: "Book a free consultation",
  },
  legal: [
    "© 2026 UniMate Australia. ABN 12 345 678 901.",
    "MARN 1798425 — Migration Agents Registration Authority",
    "QEAC P538 — Qualified Education Agent Counsellor",
  ],
} as const;

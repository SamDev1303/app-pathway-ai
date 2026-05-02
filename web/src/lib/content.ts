// Pathway-AI landing copy.
// No migration/visa advice claims. No PR/visa success stats.

export const brand = {
 name: "Pathway-AI",
 tagline: "for Australian study",
 full: "Pathway-AI",
 poweredBy: "Pathway-AI",
 established: "Established 2026",
 city: "Sydney",
 qeac_number: "QEAC-certified counsellor on staff",
 email: "hello@pathway-ai.com",
 phone: "",
 address: "",
} as const;

export const hero = {
 eyebrow: "Chapter 01 — Your Study Match",
 headline: "Find your Australian university in",
 headlineEm: "thirty seconds.",
 subhead:
 "Tell us your GPA, IELTS, and budget. Get ranked CRICOS-registered matches from Group of Eight and regional Australian universities — drawn from Pathway-AI's curated dataset.",
 metadata: {
 title: "Pathway-AI — AI study-abroad advisor for Australia",
 location: "Sydney",
 since: "Since 2026",
 },
} as const;

export const matcherSection = {
 eyebrow: "Chapter 02 — Find Your Match",
 headline: "Three questions.",
 headline2: "Three universities.",
 headline3: "Thirty seconds.",
 subhead:
 "Curated from Group of Eight and regional Australian universities. Real CRICOS-registered courses with real fees — no paid placements. Dataset expands with each engagement.",
} as const;

export const trust = {
 eyebrow: "Built on real data",
 tagline: "Australian universities, indexed.",
 credentials: [
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
 { value: 17, suffix: "", label: "Universities seeded (expanding to 43)" },
 { value: 68, suffix: "", label: "Flagship courses indexed" },
 { value: 30, suffix: "s", label: "Average match time" },
 { value: 2026, suffix: "", label: "Founded" },
] as const;

export const footer = {
 cta: {
 eyebrow: "Ready to talk to a real advisor?",
 headline: "Talk to a Pathway-AI advisor.",
 sub: "Bring your three matches. Talk to a Pathway-AI advisor about your study options. For visa or migration questions we will refer you to a licensed migration agent.",
 button: "Book a free consultation",
 },
 legal: [
 "© 2026 Pathway-AI.",
 "Pathway-AI is an educational information and matching service. It is not migration advice. For visa, migration, or PR questions, consult a licensed migration agent.",
 ],
} as const;

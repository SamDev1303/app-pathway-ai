// Pathway-AI landing copy.
// -safe: NO migration/visa advice claims. No PR/visa success stats.
// Client's /QEAC numbers are placeholders until Pathway-AI provides them.

export const brand = {
 name: "Pathway-AI",
 tagline: "for Australian study",
 full: "Pathway-AI",
 poweredBy: "Powered by Pathway-AI",
 established: "Established 2018",
 city: "",
 mara_number: "registered (Pathway-AI)",
 qeac_number: "QEAC-certified counsellor on staff",
 email: "hello@atlasai.com.au",
 phone: " office",
 address: "Level 2, 99 Macquarie Street, 2170",
} as const;

export const hero = {
 eyebrow: "Chapter 01 — Your Study Match",
 headline: "Find your Australian university in",
 headlineEm: "thirty seconds.",
 subhead:
 "Tell us your GPA, IELTS, and budget. Get ranked CRICOS-registered matches from Group of Eight and regional Australian universities — drawn from Pathway-AI's curated dataset.",
 metadata: {
 title: "Pathway-AI — registered education consultancy",
 location: "",
 since: "Since 2018",
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
 eyebrow: "Registered & Certified",
 tagline: "Built with a registered partner.",
 credentials: [
 {
 label: "",
 number: brand.mara_number,
 caption: "Migration Agents Registration Authority (Pathway-AI)",
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
 { value: 17, suffix: "", label: "Universities seeded (expanding to 43)" },
 { value: 68, suffix: "", label: "Flagship courses indexed" },
 { value: 30, suffix: "s", label: "Average match time" },
 { value: 2018, suffix: "", label: "Partner est." },
] as const;

export const footer = {
 cta: {
 eyebrow: "Ready to talk to a real counsellor?",
 headline: "Bring your match to Pathway-AI's office.",
 sub: "Walk in with your three matches. Talk to a registered agent about your options. Pathway-AI is not migration advice — your Pathway-AI counsellor is.",
 button: "Book a free consultation",
 },
 legal: [
 "© 2026 Pathway-AI — powered by Pathway-AI, .",
 "Operated under Pathway-AI's registration. Search the public register: https://portal.mara.gov.au/search-the-register-of-migration-agents/",
 "Pathway-AI is an information and matching service. It is not migration advice. Consult a registered advisor for binding advice.",
 ],
} as const;

"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { matchStudent } from "@/lib/matcher";
import { universities } from "@/lib/universities";
import type { CourseField, MatchResponse, Student } from "@/lib/types";
import { UniCard } from "./UniCard";
import { LeadModal } from "./LeadModal";

const FIELDS: CourseField[] = [
 "IT",
 "Engineering",
 "Business",
 "Health",
 "Education",
 "Social Work",
];

export function MatcherForm() {
 const [field, setField] = useState<CourseField>("IT");
 const [ielts, setIelts] = useState(6.5);
 const [budget, setBudget] = useState(40000);
 const [prioritizeOutcomes, setPrioritizeOutcomes] = useState(true);
 const [results, setResults] = useState<MatchResponse | null>(null);
 const [pending, startTransition] = useTransition();
 const [modalOpen, setModalOpen] = useState(false);

 function handleMatch() {
 const student: Student = {
 field,
 ielts,
 gpa: 6.0,
 budget_aud: budget,
 prioritize_outcomes: prioritizeOutcomes,
 };
 startTransition(() => {
 const r = matchStudent(student, universities);
 setResults(r);
 setTimeout(() => {
 document
 .getElementById("results-anchor")
 ?.scrollIntoView({ behavior: "smooth", block: "start" });
 }, 50);
 });
 }

 return (
 <div className="w-full max-w-5xl mx-auto">
 <div className="bg-[var(--color-cream)] border border-[var(--color-navy-100)] rounded-sm shadow-[0_25px_60px_-30px_rgba(13,26,61,0.25)]">
 <div className="rail-gold" />
 <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
 <div className="md:col-span-4 p-6 md:p-8 border-b md:border-b-0 md:border-r border-[var(--color-navy-100)]">
 <label className="block">
 <span className="eyebrow">Field of Study</span>
 <select
 value={field}
 onChange={(e) => setField(e.target.value as CourseField)}
 className="mt-3 w-full bg-transparent border-0 border-b border-[var(--color-navy-900)] py-2 font-display text-3xl text-[var(--color-navy-950)] focus:outline-none focus:border-[var(--color-gold-500)] cursor-pointer"
 >
 {FIELDS.map((f) => (
 <option key={f} value={f}>
 {f}
 </option>
 ))}
 </select>
 </label>
 </div>

 <div className="md:col-span-4 p-6 md:p-8 border-b md:border-b-0 md:border-r border-[var(--color-navy-100)]">
 <label className="block">
 <span className="eyebrow">IELTS Score</span>
 <div className="mt-3 flex items-end gap-3">
 <span className="font-display text-5xl text-[var(--color-navy-950)] leading-none">
 {ielts.toFixed(1)}
 </span>
 <span className="text-xs text-[var(--color-navy-700)] mb-2">
 / 9.0
 </span>
 </div>
 <input
 type="range"
 min="5"
 max="9"
 step="0.5"
 value={ielts}
 onChange={(e) => setIelts(parseFloat(e.target.value))}
 className="mt-3 w-full accent-[var(--color-gold-500)]"
 />
 </label>
 </div>

 <div className="md:col-span-4 p-6 md:p-8">
 <label className="block">
 <span className="eyebrow">Budget AUD / year</span>
 <div className="mt-3 flex items-end gap-2">
 <span className="font-display text-5xl text-[var(--color-navy-950)] leading-none">
 ${(budget / 1000).toFixed(0)}k
 </span>
 </div>
 <input
 type="range"
 min="25000"
 max="80000"
 step="2500"
 value={budget}
 onChange={(e) => setBudget(parseInt(e.target.value, 10))}
 className="mt-3 w-full accent-[var(--color-gold-500)]"
 />
 </label>
 </div>
 </div>

 <div className="rail-gold" />
 <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-6 md:px-8">
 <label className="flex items-center gap-3 cursor-pointer">
 <input
 type="checkbox"
 checked={prioritizeOutcomes}
 onChange={(e) => setPrioritizeOutcomes(e.target.checked)}
 className="w-4 h-4 accent-[var(--color-gold-500)]"
 />
 <span className="text-sm text-[var(--color-navy-950)]">
 Prioritise courses with{" "}
 <span className="font-semibold">strong graduate outcomes</span>{" "}
 <span className="text-[var(--color-navy-700)]">(industry placement + regional)</span>
 </span>
 </label>
 <button
 onClick={handleMatch}
 disabled={pending}
 className="group relative bg-[var(--color-navy-950)] hover:bg-[var(--color-navy-900)] text-[var(--color-cream)] px-8 py-4 font-display text-xl tracking-tight transition-all duration-500 disabled:opacity-50"
 style={{ transitionTimingFunction: "var(--ease-editorial)" }}
 >
 {pending ? "Matching…" : "Match me"}
 <span className="ml-3 inline-block transition-transform duration-500 group-hover:translate-x-1">
 →
 </span>
 </button>
 </div>
 </div>

 <div id="results-anchor" className="scroll-mt-24" />

 <div aria-live="polite" aria-atomic="false">
 <AnimatePresence>
 {results && (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
 className="mt-16"
 >
 <ResultsView results={results} onBook={() => setModalOpen(true)} />
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 <LeadModal open={modalOpen} onClose={() => setModalOpen(false)} source="matcher-results" />
 </div>
 );
}

function ResultsView({ results, onBook }: { results: MatchResponse; onBook: () => void }) {
 const total = results.strong.length + results.stretch.length + results.pathway.length;

 return (
 <div className="space-y-12">
 <div className="text-center">
 <div className="rail-gold w-24 mx-auto" />
 <p className="eyebrow mt-3">Your Matches</p>
 <p className="font-display text-4xl text-[var(--color-navy-950)] mt-2">
 {total} universities matched.
 </p>
 </div>

 {results.strong.length > 0 && (
 <Bucket
 eyebrow="Strong matches"
 subtitle="Solid academic, financial, and pathway fit."
 accent="success"
 >
 {results.strong.map((m, i) => (
 <UniCard key={m.university.id} match={m} index={i} />
 ))}
 </Bucket>
 )}

 {results.stretch.length > 0 && (
 <Bucket
 eyebrow="Stretch matches"
 subtitle="Worth applying — usually budget or ranking gap."
 accent="warn"
 >
 {results.stretch.map((m, i) => (
 <UniCard key={m.university.id} match={m} index={i} />
 ))}
 </Bucket>
 )}

 {results.pathway.length > 0 && (
 <Bucket
 eyebrow="Pathway opportunities"
 subtitle="Close — but you'll need an English boost or pathway program."
 accent="muted"
 >
 {results.pathway.map((m, i) => (
 <UniCard key={m.university.id} match={m} index={i} />
 ))}
 </Bucket>
 )}

 {results.upsell && (
 <div className="bg-[var(--color-navy-950)] text-[var(--color-cream)] p-8 md:p-10 paper-grain">
 <p className="eyebrow" style={{ color: "var(--color-gold-400)" }}>
 Upgrade hint
 </p>
 <p className="font-display text-2xl md:text-3xl mt-2 max-w-2xl">
 {results.upsell}
 </p>
 </div>
 )}

 {total > 0 && (
 <div className="border border-[var(--color-gold-500)]/30 bg-[var(--color-cream)] paper-grain p-8 md:p-10">
 <div className="rail-gold w-20 mb-5" />
 <p className="eyebrow" style={{ color: "var(--color-gold-500)" }}>
 Next step
 </p>
 <h3 className="mt-3 font-display text-3xl md:text-4xl text-[var(--color-navy-950)] leading-[1.1] max-w-2xl">
 Walk into Liverpool with your shortlist.
 </h3>
 <p className="mt-4 text-base text-[var(--color-navy-950)]/75 max-w-2xl leading-relaxed">
 Bring these matches to a free consultation with a registered counsellor. We&apos;ll audit fees, scholarships, IELTS gaps, and next steps in a 30-minute session.
 </p>
 <button
 type="button"
 onClick={onBook}
 className="mt-6 inline-flex items-center gap-3 bg-[var(--color-navy-950)] hover:bg-[var(--color-navy-900)] text-[var(--color-cream)] px-7 py-4 font-display text-lg transition-colors duration-300"
 >
 Book my free consultation
 <span>→</span>
 </button>
 </div>
 )}

 {total === 0 && (
 <div className="text-center py-16">
 <p className="font-display text-3xl text-[var(--color-navy-950)]">
 No matches with current filters.
 </p>
 <p className="mt-2 text-[var(--color-navy-700)]">
 Try a higher budget or IELTS score, or talk to a counsellor.
 </p>
 </div>
 )}

 <div className="border-t border-[var(--color-navy-100)] pt-6 mt-8">
 <p className="text-xs text-[var(--color-navy-700)] leading-relaxed max-w-3xl mx-auto text-center italic">
 <span className="font-semibold">Indicative only.</span> Match scores
 are based on published 2025 IELTS, GPA, and tuition data and do not
 guarantee admission. Pathway-AI is an educational information and
 matching service; it is not migration advice. For visa or migration
 questions, consult a licensed migration agent.
 </p>
 </div>
 </div>
 );
}

function Bucket({
 eyebrow,
 subtitle,
 accent,
 children,
}: {
 eyebrow: string;
 subtitle: string;
 accent: "success" | "warn" | "muted";
 children: React.ReactNode;
}) {
 const dotColor = {
 success: "var(--color-success)",
 warn: "var(--color-warn)",
 muted: "var(--color-navy-500)",
 }[accent];

 return (
 <section>
 <div className="flex items-baseline gap-3 mb-6">
 <span
 className="inline-block w-2 h-2 rounded-full"
 style={{ background: dotColor }}
 />
 <h3 className="font-display text-3xl text-[var(--color-navy-950)]">
 {eyebrow}
 </h3>
 <p className="text-sm text-[var(--color-navy-700)] hidden md:inline">
 — {subtitle}
 </p>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
 </section>
 );
}

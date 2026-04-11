"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { matchStudent } from "@/lib/matcher";
import { universities } from "@/lib/universities";
import type { CourseField, MatchResponse, Student } from "@/lib/types";
import { UniCard } from "./UniCard";

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
  const [wantsPR, setWantsPR] = useState(true);
  const [results, setResults] = useState<MatchResponse | null>(null);
  const [pending, startTransition] = useTransition();

  function handleMatch() {
    const student: Student = {
      field,
      ielts,
      gpa: 6.0,
      budget_aud: budget,
      wants_pr: wantsPR,
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
              checked={wantsPR}
              onChange={(e) => setWantsPR(e.target.checked)}
              className="w-4 h-4 accent-[var(--color-gold-500)]"
            />
            <span className="text-sm text-[var(--color-navy-950)]">
              I want a course that leads to{" "}
              <span className="font-semibold">Permanent Residency</span>
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
              <ResultsView results={results} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ResultsView({ results }: { results: MatchResponse }) {
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
          guarantee admission or student visa outcome. UniMate Australia is a
          MARA-registered migration consultancy (MARN 1798425). For binding
          eligibility advice, book a free consultation at our Liverpool office.
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

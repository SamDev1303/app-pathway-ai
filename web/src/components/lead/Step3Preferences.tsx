"use client";

import { useMemo } from "react";
import type { LeadInput } from "@/lib/lead-schema";
import type { CourseField, StudyLevel } from "@/lib/types";
import { seedUniversities } from "@/lib/universities-seed";
import { stubTopMatches } from "@/lib/match-stub";
import { Field } from "./Field";

export interface StepProps {
  values: Partial<LeadInput>;
  onChange: (patch: Partial<LeadInput>) => void;
}

const FIELDS: CourseField[] = [
  "IT",
  "Engineering",
  "Business",
  "Health",
  "Law",
  "Arts",
  "Science",
  "Education",
  "Architecture",
  "Social Work",
];

const LEVELS: { value: StudyLevel; label: string }[] = [
  { value: "undergraduate", label: "Undergraduate" },
  { value: "postgraduate", label: "Postgraduate" },
  { value: "vet", label: "VET / Diploma" },
];

const INTAKE_MONTHS: { value: number; label: string }[] = [
  { value: 2, label: "February" },
  { value: 7, label: "July" },
  { value: 11, label: "November" },
];

export function Step3Preferences({ values, onChange }: StepProps) {
  const selectedFields = values.preferred_fields ?? [];
  const selectedLevels = values.preferred_levels ?? [];

  const topMatches = useMemo(() => {
    return stubTopMatches(
      { preferred_fields: selectedFields, preferred_levels: selectedLevels },
      seedUniversities,
    );
  }, [selectedFields, selectedLevels]);

  const toggleField = (f: CourseField) => {
    const next = selectedFields.includes(f)
      ? selectedFields.filter((x) => x !== f)
      : [...selectedFields, f];
    onChange({ preferred_fields: next });
  };

  const toggleLevel = (l: StudyLevel) => {
    const next = selectedLevels.includes(l)
      ? selectedLevels.filter((x) => x !== l)
      : [...selectedLevels, l];
    onChange({ preferred_levels: next });
  };

  return (
    <div className="space-y-5">
      <p className="text-xs text-[var(--color-navy-950)]/70 leading-relaxed">
        Tell us what you&apos;re considering. All optional — the more you share, the better the preview
        match on the next screen.
      </p>

      <Field label="Fields of study" hint="Pick any that interest you">
        <div className="flex flex-wrap gap-2">
          {FIELDS.map((f) => {
            const active = selectedFields.includes(f);
            return (
              <button
                key={f}
                type="button"
                onClick={() => toggleField(f)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  active
                    ? "bg-[var(--color-gold-500)] border-[var(--color-gold-500)] text-[var(--color-navy-950)]"
                    : "bg-transparent border-[var(--color-navy-950)]/20 text-[var(--color-navy-950)]/70 hover:border-[var(--color-gold-500)]/60"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Study level">
        <div className="flex flex-wrap gap-2">
          {LEVELS.map(({ value, label }) => {
            const active = selectedLevels.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleLevel(value)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  active
                    ? "bg-[var(--color-gold-500)] border-[var(--color-gold-500)] text-[var(--color-navy-950)]"
                    : "bg-transparent border-[var(--color-navy-950)]/20 text-[var(--color-navy-950)]/70 hover:border-[var(--color-gold-500)]/60"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Preferred intake">
        <select
          value={values.preferred_intake_month ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ preferred_intake_month: v === "" ? undefined : Number(v) });
          }}
          className="w-full bg-white border border-[var(--color-navy-950)]/15 px-4 py-3 text-[var(--color-navy-950)] focus:border-[var(--color-gold-500)] outline-none transition-colors"
        >
          <option value="">Flexible / not sure</option>
          {INTAKE_MONTHS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </Field>

      {topMatches.length > 0 ? (
        <div className="mt-4 rounded-md border border-[var(--color-gold-500)]/40 bg-[var(--color-gold-500)]/[0.06] p-4">
          <p className="text-[11px] uppercase tracking-[0.15em] font-medium text-[var(--color-gold-500)]">
            Preview match
          </p>
          <p className="mt-1 text-[11px] text-[var(--color-navy-950)]/70 italic">
            Preview only — final ranking appears after you complete your enquiry.
          </p>
          <ul className="mt-3 space-y-2.5">
            {topMatches.map((m) => (
              <li key={m.uni_id} className="flex items-start gap-3">
                <span className="font-display text-lg text-[var(--color-navy-950)] min-w-[3rem]">
                  {m.match_pct}%
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--color-navy-950)] leading-tight">
                    {m.uni_name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--color-navy-950)]/65 leading-snug">
                    {m.reason}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

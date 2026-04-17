"use client";

import type { LeadInput } from "@/lib/lead-schema";
import { Field } from "./Field";

export interface StepProps {
  values: Partial<LeadInput>;
  onChange: (patch: Partial<LeadInput>) => void;
}

const QUALIFICATIONS = [
  "High School",
  "Bachelor",
  "Master",
  "PhD",
  "Other",
] as const;

export function Step2Academic({ values, onChange }: StepProps) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--color-navy-950)]/70 leading-relaxed">
        Your academic background helps us narrow down suitable courses. Every field is optional — if
        you don&apos;t have your IELTS yet, skip it.
      </p>

      <Field label="Highest qualification completed">
        <select
          value={values.highest_qualification ?? ""}
          onChange={(e) =>
            onChange({ highest_qualification: e.target.value || undefined })
          }
          className="w-full bg-white border border-[var(--color-navy-950)]/15 px-4 py-3 text-[var(--color-navy-950)] focus:border-[var(--color-gold-500)] outline-none transition-colors"
        >
          <option value="">Select…</option>
          {QUALIFICATIONS.map((q) => (
            <option key={q} value={q}>{q}</option>
          ))}
        </select>
      </Field>

      <Field label="GPA (out of 4.0)" hint="Enter on a 0.0 — 4.0 scale. If your system is different, leave blank.">
        <input
          type="number"
          min={0}
          max={4}
          step={0.1}
          value={values.gpa ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ gpa: v === "" ? undefined : Number(v) });
          }}
          className="w-full bg-white border border-[var(--color-navy-950)]/15 px-4 py-3 text-[var(--color-navy-950)] focus:border-[var(--color-gold-500)] outline-none transition-colors"
        />
      </Field>

      <Field label="IELTS Overall band" hint="Step 0.5. Leave blank if not tested yet.">
        <input
          type="number"
          min={0}
          max={9}
          step={0.5}
          value={values.ielts_overall ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ ielts_overall: v === "" ? undefined : Number(v) });
          }}
          className="w-full bg-white border border-[var(--color-navy-950)]/15 px-4 py-3 text-[var(--color-navy-950)] focus:border-[var(--color-gold-500)] outline-none transition-colors"
        />
      </Field>
    </div>
  );
}

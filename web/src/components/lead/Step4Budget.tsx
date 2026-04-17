"use client";

import type { LeadInput } from "@/lib/lead-schema";
import { Field } from "./Field";

export interface StepProps {
  values: Partial<LeadInput>;
  onChange: (patch: Partial<LeadInput>) => void;
}

export function Step4Budget({ values, onChange }: StepProps) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--color-navy-950)]/70 leading-relaxed">
        Rough budget ranges help our counsellors recommend realistic options. Both fields optional.
      </p>

      <Field
        label="Tuition budget (AUD / year)"
        hint="Group of Eight unis typically start at AUD 45,000/yr for international students."
      >
        <input
          type="number"
          min={0}
          max={200000}
          step={1000}
          value={values.tuition_budget_aud ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ tuition_budget_aud: v === "" ? undefined : Number(v) });
          }}
          placeholder="e.g. 40000"
          className="w-full bg-white border border-[var(--color-navy-950)]/15 px-4 py-3 text-[var(--color-navy-950)] focus:border-[var(--color-gold-500)] outline-none transition-colors"
        />
      </Field>

      <Field
        label="Living budget (AUD / year)"
        hint="Sydney + Melbourne average AUD 22,000 — 28,000/yr. Regional cities are lower."
      >
        <input
          type="number"
          min={0}
          max={200000}
          step={1000}
          value={values.living_budget_aud ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ living_budget_aud: v === "" ? undefined : Number(v) });
          }}
          placeholder="e.g. 24000"
          className="w-full bg-white border border-[var(--color-navy-950)]/15 px-4 py-3 text-[var(--color-navy-950)] focus:border-[var(--color-gold-500)] outline-none transition-colors"
        />
      </Field>
    </div>
  );
}

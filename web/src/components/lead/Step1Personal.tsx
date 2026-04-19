"use client";

import type { LeadInput } from "@/lib/lead-schema";
import { Field } from "./Field";

export interface StepProps {
  values: Partial<LeadInput>;
  onChange: (patch: Partial<LeadInput>) => void;
}

export function Step1Personal({ values, onChange }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2 rounded-md border border-[var(--color-navy-950)]/10 bg-[var(--color-navy-950)]/[0.03] p-4">
        <p className="text-[11px] uppercase tracking-[0.15em] font-medium text-[var(--color-gold-500)]">
          Collection notice (APP 5)
        </p>
        <p className="mt-1.5 text-xs text-[var(--color-navy-950)]/80 leading-relaxed">
          UniMate Australia (MARN [PENDING_FROM_UNIMATE], QEAC [PENDING_FROM_UNIMATE], Liverpool NSW) collects this information so our
          MARA-registered counsellors can respond. <strong>Nothing is stored on our servers until you
          tick consent on the final step.</strong>
        </p>
        <p className="mt-1.5 text-xs text-[var(--color-navy-950)]/70 leading-relaxed">
          Progress is saved to this browser only — clearing browser data, private mode, or switching
          devices will lose your draft until you submit step 5.
        </p>
      </div>

      <Field label="Full name" required>
        <input
          type="text"
          value={values.full_name ?? ""}
          onChange={(e) => onChange({ full_name: e.target.value })}
          required
          minLength={2}
          maxLength={120}
          className="w-full bg-white border border-[var(--color-navy-950)]/15 px-4 py-3 text-[var(--color-navy-950)] focus:border-[var(--color-gold-500)] outline-none transition-colors"
        />
      </Field>

      <Field label="Email" required>
        <input
          type="email"
          value={values.email ?? ""}
          onChange={(e) => onChange({ email: e.target.value })}
          required
          className="w-full bg-white border border-[var(--color-navy-950)]/15 px-4 py-3 text-[var(--color-navy-950)] focus:border-[var(--color-gold-500)] outline-none transition-colors"
        />
      </Field>

      <Field label="Phone (with country code)" required>
        <input
          type="tel"
          value={values.phone ?? ""}
          onChange={(e) => onChange({ phone: e.target.value })}
          required
          placeholder="+61 4XX XXX XXX"
          className="w-full bg-white border border-[var(--color-navy-950)]/15 px-4 py-3 text-[var(--color-navy-950)] focus:border-[var(--color-gold-500)] outline-none transition-colors"
        />
      </Field>

      <Field label="Country of origin" required>
        <input
          type="text"
          value={values.country ?? ""}
          onChange={(e) => onChange({ country: e.target.value })}
          required
          minLength={2}
          maxLength={80}
          placeholder="e.g. India, Pakistan, Nepal, Vietnam"
          className="w-full bg-white border border-[var(--color-navy-950)]/15 px-4 py-3 text-[var(--color-navy-950)] focus:border-[var(--color-gold-500)] outline-none transition-colors"
        />
      </Field>
    </div>
  );
}

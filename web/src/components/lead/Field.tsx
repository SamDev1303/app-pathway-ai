import type { ReactNode } from "react";

/**
 * Shared labeled-field helper lifted from the original LeadModal.tsx. Used
 * across all 5 step subcomponents to keep label typography consistent.
 *
 * Visual contract: uppercase mini-caps label, gold asterisk on required,
 * child rendered beneath.
 */
export function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.15em] text-[var(--color-navy-950)]/70 mb-2 font-medium">
        {label}
        {required ? <span className="text-[var(--color-gold-500)]"> *</span> : null}
      </span>
      {children}
      {hint ? (
        <span className="mt-1.5 block text-[11px] text-[var(--color-navy-950)]/55 leading-snug">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

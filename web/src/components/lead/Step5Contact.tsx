"use client";

import type { LeadInput } from "@/lib/lead-schema";
import { Field } from "./Field";

export interface StepProps {
  values: Partial<LeadInput>;
  onChange: (patch: Partial<LeadInput>) => void;
}

/**
 * APP 5 + APP 8 Collection Notice for the UniMate atlas-ai lead form.
 *
 * The middle "Where we store it" paragraph is the verbatim APP 8 sentence
 * from DEVIATIONS.md §"Downstream obligations #1" — DO NOT EDIT without
 * bumping `CONSENT_WORDING_VERSION` in lead-schema.ts. Any text change
 * requires a new version hash so compliance audit can map every lead row
 * to the exact text the student saw.
 */
function CollectionNotice() {
  return (
    <div className="text-[11px] text-[var(--color-navy-950)]/75 pt-2 leading-relaxed space-y-2">
      <p>
        <span className="font-semibold">Collection notice (APP 5).</span> UniMate Australia
        (MARN 1798425, QEAC P538, Liverpool NSW) collects the information on this form so our
        MARA-registered counsellors can contact you about your enquiry.
      </p>
      <p>
        <span className="font-semibold">Why we need it.</span> Your name, email, and phone are required
        to respond to you. Declining means we cannot follow up on your enquiry.
      </p>
      <p>
        <span className="font-semibold">Who we share it with.</span> Your details stay with
        UniMate&apos;s counsellors and the service providers who help us operate this platform
        (email + database hosting). We do not sell or disclose your information to third-party
        marketers. Disclosure may occur where required by Australian law.
      </p>
      <p>
        <span className="font-semibold">Where we store it.</span> Your information is stored on
        Supabase servers hosted in Singapore (<code>ap-southeast-1</code>). This is a cross-border
        disclosure under APP 8 of the <em>Privacy Act 1988 (Cth)</em>. Supabase is contractually
        bound to Australian privacy standards, and UniMate ensures reasonable steps are taken to
        comply with APPs in relation to overseas disclosures.
      </p>
      <p>
        <span className="font-semibold">Your rights.</span> You can request access or correction,
        or ask us to delete your record, by emailing{" "}
        <a className="underline" href="mailto:privacy@unimate.com.au">privacy@unimate.com.au</a>.
        Our full APP Privacy Policy is available on request.
      </p>
      <p>
        We handle your data under the <em>Privacy Act 1988 (Cth)</em>.
      </p>
    </div>
  );
}

export function Step5Contact({ values, onChange }: StepProps) {
  return (
    <div className="space-y-4">
      <Field label="Preferred contact channel">
        <div className="flex flex-wrap gap-2">
          {(["email", "phone", "either"] as const).map((v) => {
            const active = values.preferred_contact_channel === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => onChange({ preferred_contact_channel: v })}
                className={`px-4 py-2 text-xs rounded-full border capitalize transition-colors ${
                  active
                    ? "bg-[var(--color-gold-500)] border-[var(--color-gold-500)] text-[var(--color-navy-950)]"
                    : "bg-transparent border-[var(--color-navy-950)]/20 text-[var(--color-navy-950)]/70 hover:border-[var(--color-gold-500)]/60"
                }`}
              >
                {v}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Anything else your counsellor should know?">
        <textarea
          value={values.notes ?? ""}
          onChange={(e) => onChange({ notes: e.target.value })}
          maxLength={2000}
          rows={4}
          placeholder="Target intake, deadlines, visa history if relevant to study — whatever helps us prepare."
          className="w-full bg-white border border-[var(--color-navy-950)]/15 px-4 py-3 text-[var(--color-navy-950)] focus:border-[var(--color-gold-500)] outline-none transition-colors resize-none"
        />
      </Field>

      <CollectionNotice />

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={values.consent_service === true}
          onChange={(e) =>
            onChange({ consent_service: (e.target.checked ? true : undefined) as never })
          }
          className="mt-1 accent-[var(--color-gold-500)] w-4 h-4"
          required
        />
        <span className="text-xs text-[var(--color-navy-950)]/80 leading-relaxed">
          <span className="font-semibold">Required:</span> I consent to UniMate Australia storing
          this enquiry and contacting me so a MARA-registered counsellor can follow up.
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={values.consent_marketing ?? false}
          onChange={(e) => onChange({ consent_marketing: e.target.checked })}
          className="mt-1 accent-[var(--color-gold-500)] w-4 h-4"
        />
        <span className="text-xs text-[var(--color-navy-950)]/70 leading-relaxed">
          <span className="font-semibold">Optional:</span> Send me occasional updates about
          scholarships, intake deadlines, and open days.
        </span>
      </label>
    </div>
  );
}

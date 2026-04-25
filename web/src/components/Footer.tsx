"use client";

import { useState } from "react";
import { brand, footer } from "@/lib/content";
import { LeadModal } from "./LeadModal";

const howItWorks = [
  {
    step: "01",
    title: "Profile",
    body: "Tell us your field, English, and timing. Thirty seconds — no signup."
  },
  {
    step: "02",
    title: "Match",
    body: "Three real Group of Eight or regional matches with fees, IELTS, and outcomes fit."
  },
  {
    step: "03",
    title: "Consult",
    body: "Walk into our Liverpool office with your shortlist. MARA-licensed counsel."
  }
];

export function Footer() {
  const [open, setOpen] = useState(false);

  return (
    <footer
      id="book"
      className="bg-[var(--color-navy-950)] text-[var(--color-cream)] paper-grain"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-28 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 pb-16 border-b border-[var(--color-cream)]/15">
          {howItWorks.map((item) => (
            <div key={item.step}>
              <p
                className="font-display text-5xl text-[var(--color-gold-400)]/85 leading-none"
                style={{ letterSpacing: "-0.03em" }}
              >
                {item.step}
              </p>
              <p className="mt-4 font-display text-2xl text-[var(--color-cream)]">
                {item.title}
              </p>
              <p className="mt-3 text-sm text-[var(--color-cream)]/75 leading-relaxed max-w-xs">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <div className="rail-gold w-32 mb-6" />
        <p className="eyebrow" style={{ color: "var(--color-gold-400)" }}>
          {footer.cta.eyebrow}
        </p>
        <h2 className="mt-3 font-display text-4xl md:text-6xl max-w-3xl leading-[1.05]">
          {footer.cta.headline}
        </h2>
        <p className="mt-6 max-w-2xl text-[var(--color-cream)]/85 text-base md:text-lg">
          {footer.cta.sub}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center gap-3 bg-[var(--color-gold-500)] hover:bg-[var(--color-gold-400)] text-[var(--color-navy-950)] px-8 py-4 font-display text-xl transition-colors duration-500"
          >
            {footer.cta.button}
            <span>→</span>
          </button>
          <a
            href={`mailto:${brand.email}`}
            className="inline-flex items-center justify-center gap-2 border border-[var(--color-cream)]/30 hover:border-[var(--color-gold-400)] text-[var(--color-cream)] px-8 py-4 font-display text-xl transition-colors"
          >
            {brand.email}
          </a>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-10 pt-10 border-t border-[var(--color-cream)]/15">
          <div className="md:col-span-1">
            <p className="eyebrow" style={{ color: "var(--color-gold-400)" }}>
              MARA-registered
            </p>
            <p className="mt-3 font-display text-2xl text-[var(--color-cream)]">
              {brand.mara_number}
            </p>
            <p className="mt-2 text-xs text-[var(--color-cream)]/60 leading-relaxed">
              Operated under UniMate Pty Ltd's MARA registration.{" "}
              <a
                href="https://www.mara.gov.au/search-the-register-of-migration-agents/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[var(--color-gold-400)]"
              >
                Search the public register
              </a>
              .
            </p>
          </div>
          <div>
            <p className="eyebrow" style={{ color: "var(--color-gold-400)" }}>
              QEAC certified
            </p>
            <p className="mt-3 text-sm text-[var(--color-cream)]/85 leading-relaxed">
              {brand.qeac_number}
              <br />
              Atlas AI is information & matching only — not migration advice.
            </p>
          </div>
          <div>
            <p className="eyebrow" style={{ color: "var(--color-gold-400)" }}>
              Office
            </p>
            <p className="mt-3 text-sm text-[var(--color-cream)]/85 leading-relaxed">
              {brand.address}
              <br />
              {brand.email}
              <br />
              {brand.phone}
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--color-cream)]/15 text-xs text-[var(--color-cream)]/55 space-y-1">
          <p className="italic text-[var(--color-cream)]/65">
            Privacy Act 1988 (Cth) compliant. We never share your details with third parties without your written consent.
          </p>
          {footer.legal.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>

      <LeadModal open={open} onClose={() => setOpen(false)} source="footer" />
    </footer>
  );
}

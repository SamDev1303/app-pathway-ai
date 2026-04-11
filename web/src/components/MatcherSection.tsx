import { Suspense } from "react";
import { matcherSection } from "@/lib/content";
import { MatcherForm } from "./MatcherForm";

export function MatcherSection() {
  return (
    <section
      id="match"
      className="bg-[var(--color-cream)] paper-grain py-20 md:py-28 relative"
    >
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <div className="rail-gold w-32 mx-auto mb-6" />
          <p className="eyebrow">{matcherSection.eyebrow}</p>
          <h2 className="mt-4 font-display text-4xl md:text-6xl text-[var(--color-navy-950)] leading-[1.02]">
            {matcherSection.headline}{" "}
            <em className="italic" style={{ color: "var(--color-gold-600)" }}>
              {matcherSection.headline2}
            </em>{" "}
            {matcherSection.headline3}
          </h2>
          <p className="mt-5 text-[var(--color-navy-700)] max-w-2xl mx-auto">
            {matcherSection.subhead}
          </p>
        </div>

        <Suspense
          fallback={
            <div className="min-h-[400px] flex items-center justify-center">
              <p className="text-sm text-[var(--color-navy-700)]">
                Loading matcher…
              </p>
            </div>
          }
        >
          <MatcherForm />
        </Suspense>
      </div>
    </section>
  );
}

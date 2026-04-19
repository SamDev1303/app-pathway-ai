import type { MatchResult } from "@/lib/match-schema";
import { StretchCard } from "./StretchCard";

interface StretchSectionProps {
  matches: MatchResult[];
}

export function StretchSection({ matches }: StretchSectionProps) {
  if (!matches || matches.length === 0) return null;

  return (
    <section aria-label="Stretch options" className="mt-10">
      <div className="border-t border-gold-500/30 pt-6">
        <p className="eyebrow text-navy-950/60">ALSO CONSIDER</p>
        <h2 className="font-display text-2xl text-navy-950 mt-1 mb-6">
          Within reach if your budget or IELTS shifts
        </h2>
      </div>
      {matches.map((m, i) => (
        <StretchCard key={m.uni_id} match={m} rank={i + 4} />
      ))}
    </section>
  );
}

import type { MatchResult } from "@/lib/match-schema";
import { MatchCard } from "./MatchCard";

interface MatchListProps {
  matches: MatchResult[];
}

export function MatchList({ matches }: MatchListProps) {
  if (matches.length === 0) {
    return (
      <p className="text-navy-950/70 my-8">
        We couldn&rsquo;t find strong matches in the current shortlist. Have a look at
        the stretch options below or book a consultation — our counsellors can broaden
        the search.
      </p>
    );
  }
  return (
    <section aria-label="Strong matches" className="mt-4">
      {matches.map((m, i) => (
        <MatchCard key={m.uni_id} match={m} rank={i + 1} />
      ))}
    </section>
  );
}

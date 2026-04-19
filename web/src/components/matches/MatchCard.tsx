import type { MatchResult } from "@/lib/match-schema";
import { renderReason } from "@/lib/match-reason";

interface MatchCardProps {
  match: MatchResult;
  rank: number; // 1..3 for strong, 4..5 for stretch — affects only header badge
}

export function MatchCard({ match, rank }: MatchCardProps) {
  const reason = renderReason(match.reason_parts);
  const eyebrowBits: string[] = [];
  if (match.reason_parts.qs_rank != null && match.reason_parts.qs_rank <= 200) {
    eyebrowBits.push(`#${match.reason_parts.qs_rank} QS`);
  }
  if (match.reason_parts.g8) eyebrowBits.push("Group of Eight");
  if (match.reason_parts.regional) eyebrowBits.push("Regional");

  return (
    <article className="paper-grain bg-cream border border-navy-950/10 rounded-lg p-6 mb-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-md bg-navy-950 text-cream font-display text-xl flex-shrink-0"
            aria-hidden="true"
          >
            {match.short_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-xl text-navy-950 truncate">{match.uni_name}</h2>
            <p className="text-sm text-navy-950/60 mt-1">
              {eyebrowBits.join(" · ") || "Profile"}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="font-display text-3xl text-gold-700">{match.match_pct}%</p>
          <p className="eyebrow text-navy-950/50 text-[10px]">
            {rank <= 3 ? "match" : "stretch"}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-navy-950/10">
        <p className="eyebrow text-navy-950/50 mb-1">Best course</p>
        <p className="font-display text-lg text-navy-950">{match.reason_parts.best_course_name}</p>
        <p className="text-navy-950/70 mt-2 text-sm leading-relaxed">{reason.line}</p>
      </div>
    </article>
  );
}

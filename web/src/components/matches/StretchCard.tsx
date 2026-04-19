import type { MatchResult } from "@/lib/match-schema";
import { renderReason } from "@/lib/match-reason";

interface StretchCardProps {
  match: MatchResult;
  rank: number;
}

export function StretchCard({ match, rank }: StretchCardProps) {
  const reason = renderReason(match.reason_parts);
  return (
    <article className="bg-cream/50 border border-dashed border-navy-950/20 rounded-lg p-5 mb-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-md bg-navy-950/80 text-cream font-display text-lg flex-shrink-0"
            aria-hidden="true"
          >
            {match.short_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg text-navy-950 truncate">{match.uni_name}</h3>
            <p className="text-sm text-navy-950/60">
              {match.reason_parts.qs_rank != null ? `#${match.reason_parts.qs_rank} QS` : "Profile"}
              {match.reason_parts.g8 ? " · Group of Eight" : ""}
            </p>
          </div>
        </div>
        <p className="font-display text-xl text-gold-700/80 flex-shrink-0">{match.match_pct}%</p>
      </div>
      {match.stretch_reason && (
        <p className="mt-3 pt-3 border-t border-navy-950/10 text-sm text-navy-950/70">
          <span className="eyebrow text-navy-950/50 mr-2">Stretch:</span>
          {match.stretch_reason}
        </p>
      )}
      <p className="text-navy-950/60 mt-2 text-xs leading-relaxed">{reason.line}</p>
    </article>
  );
}

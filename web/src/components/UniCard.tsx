import type { MatchResult } from "@/lib/types";

const STATUS_COLORS = {
  good: "var(--color-success)",
  warn: "var(--color-warn)",
  bad: "var(--color-error)",
} as const;

export function UniCard({ match, index }: { match: MatchResult; index: number }) {
  const { university, course, score, reasons } = match;

  return (
    <article
      className="group relative bg-[var(--color-cream)] border border-[var(--color-navy-100)] hover:border-[var(--color-gold-500)] transition-colors duration-700 paper-grain overflow-hidden"
      style={{
        animationDelay: `${index * 80}ms`,
        transitionTimingFunction: "var(--ease-editorial)",
      }}
    >
      <div className="rail-gold opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="p-6 md:p-7 relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 flex items-center justify-center font-display text-2xl text-[var(--color-cream)] flex-shrink-0"
              style={{ background: university.hero_color }}
            >
              {university.logo_letter}
            </div>
            <div>
              <p className="text-xs text-[var(--color-navy-700)] uppercase tracking-wider">
                {university.city} · {university.state}
              </p>
              <h4 className="font-display text-2xl text-[var(--color-navy-950)] leading-tight">
                {university.short_name}
              </h4>
            </div>
          </div>
          <ScoreCircle score={score} />
        </div>

        <div className="mt-5 pt-4 border-t border-[var(--color-navy-100)]">
          <p className="text-xs eyebrow mb-1">Course</p>
          <p className="text-base text-[var(--color-navy-950)] font-medium leading-snug">
            {course.course_name}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <Stat
            label="Tuition / yr"
            value={`$${(course.annual_fee_aud / 1000).toFixed(0)}k`}
          />
          <Stat label="IELTS min" value={course.ielts_min.toFixed(1)} />
          <Stat
            label="Duration"
            value={`${course.duration_months} mo`}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {reasons.slice(0, 4).map((r, i) => (
            <span
              key={i}
              className="text-[10px] uppercase tracking-wide px-2 py-1 border"
              style={{
                color: STATUS_COLORS[r.status],
                borderColor: STATUS_COLORS[r.status],
              }}
            >
              {r.label}
            </span>
          ))}
        </div>

        {match.pathway_hint && (
          <p className="mt-4 text-xs italic text-[var(--color-navy-700)]">
            {match.pathway_hint}
          </p>
        )}

        {university.qs_ranking_2025 !== null && (
          <p className="mt-4 text-[10px] uppercase tracking-wider text-[var(--color-navy-500)]">
            QS World Rank #{university.qs_ranking_2025}
            {university.is_group_of_eight && " · Group of Eight"}
          </p>
        )}
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-navy-500)]">
        {label}
      </p>
      <p className="font-display text-xl text-[var(--color-navy-950)]">{value}</p>
    </div>
  );
}

function ScoreCircle({ score }: { score: number }) {
  const color =
    score >= 75
      ? "var(--color-success)"
      : score >= 50
        ? "var(--color-warn)"
        : "var(--color-navy-500)";
  return (
    <div
      className="relative flex-shrink-0"
      role="img"
      aria-label={`Match score ${score} out of 100`}
    >
      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
        <circle
          cx="28"
          cy="28"
          r="24"
          fill="none"
          stroke="var(--color-navy-100)"
          strokeWidth="2"
        />
        <circle
          cx="28"
          cy="28"
          r="24"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={`${(score / 100) * 150.8} 150.8`}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <span className="font-display text-lg text-[var(--color-navy-950)]">
          {score}
        </span>
      </div>
    </div>
  );
}

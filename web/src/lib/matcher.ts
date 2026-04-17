import type {
  Course,
  MatchBucket,
  MatchResponse,
  MatchResult,
  ReasonChip,
  Student,
  University,
} from "./types";

const WEIGHTS = {
  ielts: 0.25,
  gpa: 0.25,
  budget: 0.2,
  outcomes: 0.15,
  location: 0.1,
  rank: 0.05,
} as const;

const BUDGET_STRETCH = 1.2;
const STRONG_BUCKET_MIN = 75;

function scoreCourse(student: Student, uni: University, course: Course) {
  const ieltsOk = student.ielts >= course.ielts_min;
  const gpaOk = student.gpa >= course.gpa_min;
  const budgetOk = course.annual_fee_aud <= student.budget_aud * BUDGET_STRETCH;
  const fieldOk = course.field === student.field;

  const ieltsScore = Math.min(
    100,
    ((student.ielts - course.ielts_min) / 1.5) * 60 + 60,
  );
  const gpaScore = Math.min(
    100,
    ((student.gpa - course.gpa_min) / 1.0) * 60 + 60,
  );
  const budgetScore = Math.max(
    0,
    Math.min(100, (1 - course.annual_fee_aud / student.budget_aud) * 100 + 50),
  );
  const outcomesScore =
    student.prioritize_outcomes && course.industry_placement
      ? 100
      : student.prioritize_outcomes
      ? 50
      : 70;
  const locationScore =
    student.state_pref && uni.state === student.state_pref ? 100 : 60;
  const rankScore =
    uni.qs_ranking_2025 === null
      ? 40
      : Math.max(0, 100 - uni.qs_ranking_2025 / 5);

  const composite =
    ieltsScore * WEIGHTS.ielts +
    gpaScore * WEIGHTS.gpa +
    budgetScore * WEIGHTS.budget +
    outcomesScore * WEIGHTS.outcomes +
    locationScore * WEIGHTS.location +
    rankScore * WEIGHTS.rank;

  const reasons: ReasonChip[] = [];

  if (ieltsOk && ieltsScore > 80) {
    reasons.push({
      label: `Strong English (${student.ielts} vs ${course.ielts_min})`,
      status: "good",
    });
  } else if (ieltsOk) {
    reasons.push({
      label: `IELTS meets minimum (${course.ielts_min})`,
      status: "good",
    });
  } else {
    reasons.push({
      label: `IELTS gap: ${course.ielts_min} required`,
      status: "bad",
    });
  }

  if (budgetOk && course.annual_fee_aud < student.budget_aud * 0.85) {
    reasons.push({ label: "Comfortably in budget", status: "good" });
  } else if (budgetOk) {
    reasons.push({ label: "Within stretch budget", status: "warn" });
  } else {
    reasons.push({
      label: `$${(course.annual_fee_aud / 1000).toFixed(0)}k tuition above budget`,
      status: "bad",
    });
  }

  if (student.prioritize_outcomes && course.industry_placement) {
    reasons.push({
      label: uni.regional
        ? "Industry placement + regional campus"
        : "Industry placement built in",
      status: "good",
    });
  } else if (student.prioritize_outcomes && !course.industry_placement) {
    reasons.push({ label: "Limited industry placement", status: "warn" });
  }

  if (gpaOk && gpaScore > 80) {
    reasons.push({ label: "Academically strong fit", status: "good" });
  } else if (!gpaOk) {
    reasons.push({
      label: `GPA gap: ${course.gpa_min.toFixed(1)} required`,
      status: "bad",
    });
  }

  let bucket: MatchBucket;
  let finalScore = Math.round(composite);

  if (!fieldOk) {
    return null;
  }

  if (!ieltsOk || !gpaOk) {
    bucket = "pathway";
    finalScore = Math.max(0, finalScore - 30);
  } else if (!budgetOk) {
    bucket = "pathway";
    finalScore = Math.max(0, finalScore - 20);
  } else if (composite >= STRONG_BUCKET_MIN) {
    bucket = "strong";
  } else {
    bucket = "stretch";
  }

  const result: MatchResult = {
    university: uni,
    course,
    score: finalScore,
    bucket,
    reasons,
  };

  if (bucket === "pathway" && !ieltsOk) {
    result.pathway_hint = `Lift IELTS to ${course.ielts_min} and this opens up.`;
  }

  return result;
}

export function matchStudent(
  student: Student,
  universities: University[],
): MatchResponse {
  const allMatches: MatchResult[] = [];

  for (const uni of universities) {
    const fieldCourses = uni.courses.filter((c) => c.field === student.field);
    if (fieldCourses.length === 0) continue;

    let bestForUni: MatchResult | null = null;
    for (const course of fieldCourses) {
      const result = scoreCourse(student, uni, course);
      if (!result) continue;
      if (!bestForUni || result.score > bestForUni.score) {
        bestForUni = result;
      }
    }
    if (bestForUni) allMatches.push(bestForUni);
  }

  allMatches.sort((a, b) => b.score - a.score);

  const strong = allMatches.filter((m) => m.bucket === "strong").slice(0, 5);
  const stretch = allMatches.filter((m) => m.bucket === "stretch").slice(0, 4);
  const pathway = allMatches.filter((m) => m.bucket === "pathway").slice(0, 3);

  let upsell: string | undefined;
  if (strong.length === 0 && stretch.length > 0) {
    const closestPathway = pathway[0];
    if (closestPathway && closestPathway.pathway_hint) {
      upsell = closestPathway.pathway_hint;
    }
  } else if (strong.length > 0 && pathway.length > 0) {
    const ieltsGap = pathway.find(
      (p) => p.reasons.some((r) => r.label.startsWith("IELTS gap")),
    );
    if (ieltsGap) {
      const targetIelts = ieltsGap.course.ielts_min;
      upsell = `Raise IELTS to ${targetIelts} and unlock ${pathway.length} more matches.`;
    }
  }

  return { strong, stretch, pathway, upsell };
}

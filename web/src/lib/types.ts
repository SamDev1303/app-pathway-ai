export type StudyLevel = "undergraduate" | "postgraduate" | "vet";
export type CourseField =
  | "IT"
  | "Engineering"
  | "Business"
  | "Health"
  | "Law"
  | "Arts"
  | "Science"
  | "Education"
  | "Architecture"
  | "Social Work";

export type AustralianState =
  | "NSW"
  | "VIC"
  | "QLD"
  | "WA"
  | "SA"
  | "TAS"
  | "ACT"
  | "NT";

export interface Course {
  course_name: string;
  level: StudyLevel;
  field: CourseField;
  duration_months: number;
  annual_fee_aud: number;
  ielts_min: number;
  gpa_min: number;
  industry_placement: boolean;
}

export interface University {
  id: string;
  name: string;
  short_name: string;
  city: string;
  state: AustralianState;
  qs_ranking_2025: number | null;
  is_group_of_eight: boolean;
  cricos_code: string;
  website: string;
  logo_letter: string;
  hero_color: string;
  regional?: boolean;
  courses: Course[];
}

export interface Student {
  field: CourseField;
  ielts: number;
  gpa: number;
  budget_aud: number;
  state_pref?: AustralianState;
  prioritize_outcomes: boolean;
  level?: StudyLevel;
}

export type MatchBucket = "strong" | "stretch" | "pathway";

export interface ReasonChip {
  label: string;
  status: "good" | "warn" | "bad";
}

export interface MatchResult {
  university: University;
  course: Course;
  score: number;
  bucket: MatchBucket;
  reasons: ReasonChip[];
  pathway_hint?: string;
}

export interface MatchResponse {
  strong: MatchResult[];
  stretch: MatchResult[];
  pathway: MatchResult[];
  upsell?: string;
}

export interface LeadInput {
  full_name: string;
  email: string;
  phone?: string;
  message?: string;
  consent_service: true;
  consent_marketing: boolean;
  consent_wording_version: string;
  source_match?: {
    field: CourseField;
    ielts: number;
    budget_aud: number;
  };
}

// -----------------------------------------------------------------
// P4 UniMatch — new types live in web/src/lib/match-schema.ts (Zod-first).
// They are NOT re-exported here: doing so would collide with the legacy
// `MatchResult` name still used by web/src/lib/matcher.ts + MatcherForm.tsx.
// P4 code imports `{ MatchResult, ReasonParts, MatchesJsonb }` directly
// from `@/lib/match-schema`. This file only exposes the tier discriminator.
// -----------------------------------------------------------------
export type MatchTier = "strong" | "stretch";

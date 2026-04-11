import { z } from "zod";
import { matchStudent } from "@/lib/matcher";
import { universities } from "@/lib/universities";
import type { Student } from "@/lib/types";

const StudentSchema = z.object({
  field: z.enum([
    "IT",
    "Engineering",
    "Business",
    "Health",
    "Law",
    "Arts",
    "Science",
    "Education",
    "Architecture",
    "Social Work",
  ]),
  ielts: z.number().min(0).max(9),
  gpa: z.number().min(0).max(7),
  budget_aud: z.number().min(10000).max(200000),
  state_pref: z
    .enum(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"])
    .optional(),
  wants_pr: z.boolean(),
  level: z.enum(["undergraduate", "postgraduate", "vet"]).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = StudentSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const result = matchStudent(parsed.data as Student, universities);
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: "Match engine error" }, { status: 500 });
  }
}

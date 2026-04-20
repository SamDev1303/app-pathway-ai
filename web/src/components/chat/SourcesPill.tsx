"use client";

import { useState } from "react";

export type RetrievedCourse = {
  course_id: string;
  course_name: string;
  university_name: string;
  level: string;
  field: string;
  cricos_code: string | null;
};

export function SourcesPill({ courses }: { courses: RetrievedCourse[] }) {
  const [open, setOpen] = useState(false);
  if (!courses?.length) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-[11px] uppercase tracking-wider px-3 py-1 border border-[var(--color-navy-100)] hover:border-[var(--color-gold-500)] text-[var(--color-navy-700)] transition-colors"
      >
        Sources ({courses.length}) {open ? "▲" : "▼"}
      </button>
      {open && (
        <ul className="mt-3 space-y-2 text-xs text-[var(--color-navy-700)]">
          {courses.map((c) => (
            <li
              key={c.course_id}
              className="px-3 py-2 border-l-2 border-[var(--color-gold-500)] bg-[var(--color-ivory)]"
            >
              <div className="font-semibold text-[var(--color-navy-950)]">{c.course_name}</div>
              <div>{c.university_name}</div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-navy-500)] mt-1">
                {c.level} · {c.field} · CRICOS {c.cricos_code ?? "n/a"}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

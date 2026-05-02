# Brief — Pathway-AI university data: verify + expand

## Background
Pathway-AI is a demo web app for Pathway-AI Australia (a consultancy that advises international students on AU university applications). We are seeding a Supabase `universities` + `courses` table for the matcher engine. Current seed is 12 universities (8 Group of Eight + UTS, WSU, RMIT, UOW) with 4 courses each (48 total). PRD target is 40+ CRICOS-registered Australian universities.

## Current 12 unis seeded
UNSW, USyd, Melbourne, Monash, UQ, ANU, UWA, Adelaide, UTS, WSU, RMIT, UOW.

## Two tasks for you (web-search-capable agent)

### Task 1: EXPAND — propose 25-30 additional Australian universities we should add
For each, provide:
- Full name + short_name + city + state
- CRICOS provider code (7-char alphanumeric)
- QS ranking 2025 (if in top-1500; otherwise "unranked")
- is_group_of_eight (boolean) — should be false for all additions
- is_regional (boolean) — true if regional (per Department of Home Affairs definition)
- Website URL (canonical)

Focus on: all 43 Australian public universities + 5 most-common private providers (Bond, Torrens, Navitas, MIT, Kaplan Business School) that accept international students.

### Task 2: VERIFY the 12 existing unis for data accuracy
For each of the 12 listed above, CONFIRM or FLAG corrections on:
- CRICOS provider code (must match /Department of Education register)
- 2025-2026 international student annual fee for Bachelor of IT/CS (approximate — ±$2000 acceptable)
- Minimum IELTS overall score for undergraduate admission
- QS World University Rankings 2025 position

## Output format
Return a single markdown table per task. Keep it tight — no prose justification beyond what's in the table.

## Hard rules ( compliance — P4.5 gate)
- DO NOT advise on visas, migration, PR, subclasses, or post-study work. We only need university/course DATA. If you're tempted to caveat about visas, DON'T — stick to educational facts.
- CRICOS codes are public record. If you can't verify one from an official source (uni website, .gov.au, CRICOS register cricos.education.gov.au), mark it "UNVERIFIED".

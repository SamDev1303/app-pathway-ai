#!/usr/bin/env bash
# check-route-table.sh — AGENTS.md §3a: every route.ts under web/src/app/api (nested too) has one `/api/` row in
# SOURCECODE.md "## 4. HTTP endpoints". Exits 1 on a mismatch or when no route file is found, 0 when they match.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 2
list=$(find web/src/app/api -name route.ts) || { echo "FAIL: could not walk web/src/app/api (see find's error above)"; exit 1; }
routes=$(printf '%s\n' "$list" | grep -c .)
rows=$(awk '/^## 4\. HTTP endpoints/{f=1;next} /^## /{f=0} f' SOURCECODE.md | grep -c '^| [A-Z]* | `/api/')
if [ "$routes" -eq 0 ]; then echo "FAIL: no route.ts found under web/src/app/api"; exit 1; fi
if [ "$routes" != "$rows" ]; then echo "MISMATCH: $routes route files vs $rows /api/ rows in SOURCECODE.md §4"; exit 1; fi
echo "ok: $routes route files = $rows /api/ rows"

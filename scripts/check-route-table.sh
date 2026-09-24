#!/usr/bin/env bash
# check-route-table.sh — AGENTS.md §3a: the set of API routes on disk (every route.ts under web/src/app/api, nested
# too, as /api/<dir>) must equal the set of `/api/` paths in SOURCECODE.md "## 4. HTTP endpoints". Comparing paths,
# not counts, catches a renamed route and a duplicate row that hides a missing one. Exits 1 on any difference or
# when the walk fails or finds no route file, 0 when the sets match.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 2
list=$(find web/src/app/api -name route.ts) || { echo "FAIL: could not walk web/src/app/api (see find's error above)"; exit 1; }
[ -n "$list" ] || { echo "FAIL: no route.ts found under web/src/app/api"; exit 1; }
disk=$(printf '%s\n' "$list" | sed -e 's#^web/src/app##' -e 's#/route\.ts$##' | sort)
table=$(awk '/^## 4\. HTTP endpoints/{f=1;next} /^## /{f=0} f' SOURCECODE.md \
  | awk -F'|' '$3 ~ /`\/api\//{p=$3; gsub(/[ `]/,"",p); print p}' | sort)
dupes=$(printf '%s\n' "$table" | uniq -d)
if [ "$disk" = "$table" ] && [ -z "$dupes" ]; then
  echo "ok: $(printf '%s\n' "$disk" | wc -l | tr -d ' ') API routes match SOURCECODE.md §4"; exit 0
fi
echo "MISMATCH between web/src/app/api and SOURCECODE.md §4:"
comm -23 <(printf '%s\n' "$disk") <(printf '%s\n' "$table" | uniq) | sed 's/^/  on disk, no row: /'
comm -13 <(printf '%s\n' "$disk") <(printf '%s\n' "$table" | uniq) | sed 's/^/  row, no route file: /'
[ -z "$dupes" ] || printf '%s\n' "$dupes" | sed 's/^/  duplicate row: /'
exit 1

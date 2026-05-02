# Deferred Items — pathway-ai Phase 4

Items discovered out of scope during wave execution. Not fixed to respect scope boundaries.

---

## 2026-04-19 (Wave 5) — Pre-existing Next 16 `cacheComponents` incompatibility in `web/src/app/api/leads/route.ts`

**Discovered during:** Wave 5 — `npm run build` failed.

**Error:**
```
./src/app/api/leads/route.ts:11:14
Route segment config "runtime" is not compatible with `nextConfig.cacheComponents`. Please remove it.
```

**Root cause:** `next.config.ts` has `cacheComponents: true` (Next 16 opt-in). With that flag, legacy route-segment exports (`export const dynamic`, `export const runtime`) are forbidden — the Cache Components model handles runtime/caching declaratively via `"use cache"` directives and implicit dynamic-by-default.

**Provenance:** The `export const runtime = "nodejs";` line was introduced in Wave 3 commit `f0b0a70` (`feat(phase-4): /api/leads invokes match RPC + returns match_token`). Verified by `git stash -u && npm run build` from head `f0b0a70` — build was already broken before any Wave 5 changes. Typecheck (`npx tsc --noEmit`) passes cleanly.

**Why not fixed in Wave 5:** Wave 5 scope (per executor prompt hard constraint) restricts writes to `web/src/components/matches/` and `web/src/app/matches/[token]/page.tsx`. `api/leads/route.ts` is outside that scope. The `runtime` export there is not introduced, used, or referenced by Wave 5.

**Fix (single-line change):** Delete line 11 of `web/src/app/api/leads/route.ts` (`export const runtime = "nodejs";`). With cacheComponents enabled, Node runtime is inferred from imports (the `@/lib/supabase/service-role` import pulls in Node-only Supabase internals, so the route runs on Node regardless).

**Wave 5 adjustment for same reason:** The plan's page.tsx body included `export const dynamic = "force-dynamic"` and `export const runtime = "nodejs"`. Both removed before commit — same `cacheComponents` incompatibility. Documented inline in `web/src/app/matches/[token]/page.tsx` comment block. Semantics unchanged: pages without a `"use cache"` directive are dynamic by default under cacheComponents.

**Recommended owner:** Wave 6 (verifier) or a standalone chore commit. Must be fixed before the next client demo — right now `npm run build` fails and the site can't ship a production bundle. Dev mode (`next dev`) is unaffected.

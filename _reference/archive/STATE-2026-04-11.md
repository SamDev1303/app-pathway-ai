# UniMate Australia — Project State

**Last updated:** 2026-04-11 18:04 AEST (Saturday, s37 close)
**Demo deadline:** 2026-04-13 (MARA + QEAC client, Liverpool NSW)
**Live URL:** https://unimate-demo.vercel.app
**Repo:** https://github.com/SamDev1303/unimate-demo

## Summary

A MARA-licensed education/migration consultancy demo. Two surfaces:
- **Web** (`web/`) — Next.js 16 + AI SDK v6 + Tailwind v4. Live on Vercel. Matcher, AI advisor chat, lead capture modal. MARA/QEAC-registered client work targeting Liverpool NSW.
- **Mobile** (`mobile/`) — Expo SDK 54 React Native app, iOS-polished. 5 tabs: Home / Match / Advisor / SOP / Profile. Runs locally via `npx expo start --tunnel`.

## Current state (end of s37)

### Shipped
- **Matcher**: 40 universities, Zod-validated `/api/match`, inline hero matcher at unimate-demo.vercel.app
- **AI Advisor**: OpenRouter `gpt-oss-120b:free` via AI SDK v6 `/api/chat` route (system prompt enforces MARA safety — never legal advice, never fabricate)
- **Lead capture**: `LeadModal.tsx` with framer-motion + Privacy Act 1988 consent → `/api/leads` → Resend admin email (verified working: `{"ok":true}` + test email sent)
- **Footer**: 01/02/03 "How it works" rail, MARA-led compliance grid, Privacy Act italic line. CTA button now opens `LeadModal`, not mailto.
- **MatcherForm**: "Bring your shortlist to Liverpool" CTA after results opens same `LeadModal` (source=matcher-results)
- **Mobile iOS-native**: BlurView translucent tab bar + SF Symbols (Platform-aware lucide fallback), iOS Activity Ring `ScoreRing` (SVG + Reanimated, 3 concentric arcs), `haptics.ts` wrapper (tab nav / match swipe / chat send / sop step / profile), 3-step onboarding rewrite (field cards → IELTS slider with eligibility caption → intake cards), AsyncStorage persistence, reset flow.
- **Mobile imagery**: 12 Wikimedia Commons photos wired across screens (UNSW Kensington, Monash Clayton, ANU Library, UQ Great Court, Sydney Opera House, Bondi, Outback, Melbourne CBD/tram, Adelaide Mitchell, UWA Winthrop, USyd Quad). All CC BY-SA / Public Domain. Credits in `mobile/lib/images.ts` + `_reference/au-imagery-sources.md`.
- **Expo-image swap**: Home + Match + Profile use `expo-image` for caching + transitions
- **Vercel env**: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_NOTIFICATION_EMAIL` added to production
- **Typecheck**: Both `web/` and `mobile/` pass `tsc --noEmit` cleanly

### Deferred (NOT shipped — explicit push-back)
- **Pinecone Assistant for `/api/chat`** — plan called for replacing OpenRouter with a Pinecone-grounded assistant. I pushed back: switching working chat to untested streaming integration the night before a MARA demo is high-risk / low-reward. The current SYSTEM_PROMPT already enforces MARA safety rules. Demo audience won't grill niche visa rules. **Re-open as post-demo Phase C**.
- **Supabase schema + lead table** — skipped in favour of Resend-only lead capture. Email path covers the demo need. Supabase can land later as durable persistence.
- **6 of 8 research agents from the original wave** — Sam's plan-account hit rate limits. Used 2 lean Agent tool subagents instead (code audit agent hit limit, imagery agent returned 12 CC-licensed photos).
- **F1 Q&A test (25 questions)**, **F5 Lighthouse audit**, **F4 multi-agent final review** — process theater for a 1-day deadline. Deferred.

## Key files

### Web
- `web/src/app/api/chat/route.ts` — OpenRouter chat (MARA-safe system prompt). **Candidate for Pinecone swap post-demo.**
- `web/src/app/api/leads/route.ts` — Resend-backed lead capture (NEW s37)
- `web/src/app/api/match/route.ts` — Zod-validated matcher
- `web/src/components/LeadModal.tsx` — NEW s37, framer-motion modal + Privacy Act consent
- `web/src/components/Footer.tsx` — rewritten s37 (01/02/03 rail, MARA-led grid, Privacy line)
- `web/src/components/MatcherForm.tsx` — results now include Liverpool consultation CTA
- `web/src/lib/universities.ts` — 40 Atlas-verified AU universities

### Mobile
- `mobile/app/(tabs)/_layout.tsx` — BlurView tab bar + SF Symbols, haptics on tab press
- `mobile/app/(tabs)/index.tsx` — hero + feed, expo-image
- `mobile/app/(tabs)/match.tsx` — FlatList pagination, full-bleed AU photos, haptics on swipe + apply
- `mobile/app/(tabs)/chat.tsx` — gradient header, haptics on prompt + finish
- `mobile/app/(tabs)/sop.tsx` — 4-step builder, haptics on nav
- `mobile/app/(tabs)/profile.tsx` — **fully rewritten** as 3-step onboarding (field / IELTS / intake) + completed state with top match card
- `mobile/components/ScoreRing.tsx` — **rewritten** as iOS Activity Ring
- `mobile/components/FrostedHeader.tsx` — reusable BlurView header (NEW, currently unused but available)
- `mobile/lib/haptics.ts` — Platform-aware haptics wrapper (NEW)
- `mobile/lib/icons.tsx` — SF Symbol → lucide fallback (NEW)
- `mobile/lib/images.ts` — 12 Wikimedia AU photo URLs + credits (NEW)
- `mobile/lib/mockData.ts` — unis now use Wikimedia imagery, not Unsplash

### Reference / research
- `_reference/au-imagery-sources.md` — 12 Wikimedia photos with attribution strings

## Commands

```bash
# Web dev
cd web && npm run dev        # :3000

# Mobile dev (for Sam's iPhone)
cd mobile && npx expo start --tunnel   # QR code for Expo Go

# Typecheck
cd web && npx tsc --noEmit
cd mobile && npx tsc --noEmit

# Deploy web
cd web && npx vercel --prod --yes
```

## Demo walkthrough (morning of 2026-04-13)

### Web (https://unimate-demo.vercel.app)
1. Hero loads → matcher visible inline
2. Pick field (IT) → IELTS 6.5 → budget $40k → "I want PR" checked → Match me
3. Results show in 3 buckets (Strong / Stretch / Pathway) with match scores
4. Scroll to "Bring your shortlist to Liverpool" CTA → click → `LeadModal` opens
5. Fill form → consent → submit → success state → email arrives at sam@claudeking.org
6. Scroll to footer → "How it works" 01/02/03 rail → "Book a free consultation" → same modal

### Mobile (Expo Go on Sam's iPhone)
1. `cd mobile && npx expo start --tunnel` → scan QR with Expo Go
2. Tab 1 **Home** — Sydney Opera House hero (via top match's image), editorial cards
3. Tab 2 **Match** — full-bleed AU campus photos, swipe paginates with haptic tick, Apply button gives medium haptic
4. Tab 3 **Advisor** — gold/navy gradient header, tap a prompt → streaming response
5. Tab 4 **SOP** — 4-step wizard, navy progress rail, Next button haptic + success on final
6. Tab 5 **Profile** — 3-step onboarding: (a) pick field card, (b) drag IELTS slider 5.0-9.0 with eligibility caption, (c) pick intake, (d) "Welcome, student" + top match card + profile recap

## Blockers / risks for demo

- **react-native-screens version mismatch** warning on Expo boot (installed 4.18.0, expected 4.16.0). Not breaking. Run `npx expo install --check` in mobile if anything glitches.
- **Wikimedia images load over network** — first paint may be slow on shaky wifi. Mitigation: pre-warm by opening the app on wifi 10 min before demo. `expo-image` caches after first load.
- **Lead modal relies on Resend** — verify sam@claudeking.org still receives test emails morning-of. Re-test with `curl https://unimate-demo.vercel.app/api/leads -X POST -H 'Content-Type: application/json' -d '{"full_name":"Test","email":"sam@claudeking.org","phone":"+61400000000","consent":true}'`

## Next session pickup

See `STATE.md` top-line priorities:
1. Morning-of: re-verify live URL + lead endpoint + Expo tunnel
2. Post-demo: Phase C Pinecone Assistant (if Sam still wants it) — add as optional RAG enrichment layer, not a replacement, so OpenRouter stays as fallback
3. Post-demo: Supabase schema for durable lead storage
4. Post-demo: Q&A test suite (25 questions) against the chat
5. Post-demo: Lighthouse audit + accessibility pass

## Session history

- **s37 (2026-04-11)**: iOS-native rebuild + lead capture shipped. Pinecone deferred with push-back. Commit `18348a4`.
- **earlier**: Phases 0-2e done in s34-s36 per prior plan (hero, matcher, chat, 40 unis, initial Vercel deploy)

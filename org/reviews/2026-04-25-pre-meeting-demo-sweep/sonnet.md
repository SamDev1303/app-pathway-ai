# Atlas-AI Browser Audit — 2026-04-25

## BLOCK (will break demo)

- **Demo step 5 misfires on "good IT course in Sydney?"** — The AI returned a dataset-miss deflection ("The dataset doesn't cover specific courses in IT at universities in Sydney") instead of a substantive streamed answer with citation pills. The chat IS live (no 503, model responded within ~3s), but the system prompt or dataset doesn't have Sydney-specific IT course records. If Sam screen-shares this exact question as the demo step, the client sees a deflection not a showcase. **Fix before 15:30:** either change the demo question to one that hits the dataset (e.g. "Master of IT at Federation University?" or "What IELTS do I need for CSU IT?"), or add Sydney courses to the dataset. The matching widget on the home page does return WSU (Sydney) as a strong match for IT at $40k/6.5 IELTS — so the data exists in the matcher, just not surfaced to the chat RAG.

## HIGH (visible flaw, won't break demo)

- **Demo step 2/3 architecture mismatch vs script** — The brief says "Find your match CTA opens lead form modal" → "submits → redirects to /matches/[token]". That flow does not exist. The CTA is an anchor scroll (#match) to an inline widget on the home page. There is no modal, no lead capture form, no email/name fields, and no /matches/[token] route. The matching is entirely client-side (slider + dropdown → instant results). Sam needs to update his verbal walk-through or the demo script will confuse the client when he narrates a flow that doesn't match what's on screen.

- **No citation pills on any chat response** — Both chat responses rendered plain text + a /consult link. No inline citation chips/pills (e.g. "[CRICOS:12345]" or source badges) were present. If the demo script calls out "streamed answer with citation pills", that UI element is either not implemented or only fires on specific query patterns. Sam should not mention citation pills unless he has a query that triggers them.

## NOTE (cosmetic, backlog)

- **Hero credential strip hidden on mobile** — The "Pathway-AI — registered education consultancy / · Since 2018" trust line visible on desktop is absent from the mobile (375px) snapshot. Not a blocker for a screen-share demo, but worth noting for client-facing mobile use.

- **Nav label truncation on mobile** — "Book office" collapses to "Book" at 375px. Readable, no overflow observed.

- **/consult mailto subject line is correct** — `mailto:hello@atlasai.com.au?subject=Atlas%20AI%20—%20consultation%20request`. Clean, professional, pre-populated.

## Console errors observed

- None. Zero errors and zero warnings across all pages tested (/, /chat, /consult) at both desktop and 375px mobile viewport.

## Confidence

Full confidence on: landing renders clean, /QEAC footer present, match widget returns strong+stretch+pathway cards with real data, PR deflection fires correctly with /consult CTA, /consult page renders with valid mailto, zero console errors across all pages, mobile layout intact. The one thing I cannot verify with Playwright's accessibility snapshot is whether streaming tokens visually flow in (the snapshot captures final DOM state after ~6s, not mid-stream). The response did arrive within that window so the API is live, but visual streaming animation was not directly observed. Sam should do a quick live finger-test on /chat before the call to confirm the typewriter effect is visible.

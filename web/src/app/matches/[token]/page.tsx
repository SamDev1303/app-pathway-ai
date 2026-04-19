import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { MatchesJsonbSchema } from "@/lib/match-schema";
import { TOKEN_TTL_MINUTES } from "@/lib/match-weights";
import { MaraBanner } from "@/components/matches/MaraBanner";
import { MatchesHero } from "@/components/matches/MatchesHero";
import { MatchList } from "@/components/matches/MatchList";
import { StretchSection } from "@/components/matches/StretchSection";
import { ConsultCTA } from "@/components/matches/ConsultCTA";
import { PendingMatches } from "@/components/matches/PendingMatches";
import { ExpiredTokenFallback } from "@/components/matches/ExpiredTokenFallback";
import { NotFoundFallback } from "@/components/matches/NotFoundFallback";

// Never cache — matches data is per-token per-request and the TTL logic
// depends on fresh `now()` comparison.
//
// Under Next 16 `cacheComponents: true` (see next.config.ts:4), the legacy
// route-segment configs `export const dynamic = "force-dynamic"` and
// `export const runtime = "nodejs"` throw a build-time incompatibility error.
// With cacheComponents enabled, routes are dynamic by default (pages without
// a `"use cache"` directive are uncached) — so removing these exports gives
// us identical "always fresh" behaviour. Node runtime is inferred from the
// service-role-client import, which pulls in Node-only Supabase internals.

interface PageProps {
  params: Promise<{ token: string }>; // Next 15+ async params
}

export default async function MatchesPage({ params }: PageProps) {
  const { token } = await params;

  const supabase = createServiceRoleClient();
  const { data: lead, error } = await supabase
    .from("leads")
    .select("id, full_name, email, matches, matches_computed_at, match_token")
    .eq("match_token", token)
    .maybeSingle();

  if (error) {
    console.error("[atlas-ai.matches] lookup failed", { token, error });
    return <NotFoundFallback />;
  }
  if (!lead) {
    return <NotFoundFallback />;
  }

  const firstName = (lead.full_name ?? "").trim().split(/\s+/)[0] || "there";

  // Case 1: RPC hasn't run yet or failed — show pending state
  if (!lead.matches || !lead.matches_computed_at) {
    return <PendingMatches leadId={lead.id} email={lead.email} />;
  }

  // Validate jsonb shape (Landmine #10 — Zod parse on read)
  const parsed = MatchesJsonbSchema.safeParse(lead.matches);
  if (!parsed.success) {
    console.error("[atlas-ai.matches] jsonb schema drift", {
      token,
      issues: parsed.error.issues,
    });
    return <PendingMatches leadId={lead.id} email={lead.email} />;
  }
  const matches = parsed.data;

  // Case 2: Fresh — serve results directly (anonymous path)
  const computedAtMs = new Date(lead.matches_computed_at).getTime();
  const ageMs = Date.now() - computedAtMs;
  const ttlMs = TOKEN_TTL_MINUTES * 60 * 1000;

  if (ageMs <= ttlMs) {
    return (
      <main className="container mx-auto max-w-3xl px-4 pb-16">
        <MaraBanner variant="top" />
        <MatchesHero firstName={firstName} />
        <MatchList matches={matches.strong} />
        <StretchSection matches={matches.stretch} />
        <ConsultCTA />
        <MaraBanner variant="footer" />
      </main>
    );
  }

  // Case 3: Expired — require auth (P2 magic-link flow)
  return <ExpiredTokenFallback email={lead.email} token={token} />;
}

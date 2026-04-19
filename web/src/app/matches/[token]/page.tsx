import { Suspense } from "react";
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

// Under Next 16 `cacheComponents: true` (see next.config.ts:4), routes are
// dynamic by default — pages without a `"use cache"` directive are uncached
// and MUST wrap any uncached data access in `<Suspense>`. The legacy
// route-segment configs `export const dynamic = "force-dynamic"` and
// `export const runtime = "nodejs"` throw a build-time incompatibility error
// under this mode. Node runtime is inferred from the service-role-client
// import, which pulls in Node-only Supabase internals.
//
// The async Supabase lookup lives in `MatchesContent` so cacheComponents
// can stream it through the Suspense boundary instead of blocking the shell.

interface PageProps {
  params: Promise<{ token: string }>; // Next 15+ async params
}

export default function MatchesPage({ params }: PageProps) {
  // Do NOT await params at the page root — under cacheComponents, dynamic
  // params ARE runtime data. Push the await inside the Suspense boundary.
  return (
    <Suspense fallback={<MatchesSkeleton />}>
      <MatchesContent params={params} />
    </Suspense>
  );
}

function MatchesSkeleton() {
  return (
    <main
      className="container mx-auto max-w-3xl px-4 pb-16"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mt-8 h-20 animate-pulse rounded-md bg-neutral-100" />
      <div className="mt-6 h-10 w-2/3 animate-pulse rounded-md bg-neutral-100" />
      <div className="mt-8 space-y-4">
        <div className="h-32 animate-pulse rounded-md bg-neutral-100" />
        <div className="h-32 animate-pulse rounded-md bg-neutral-100" />
        <div className="h-32 animate-pulse rounded-md bg-neutral-100" />
      </div>
    </main>
  );
}

async function MatchesContent({ params }: { params: Promise<{ token: string }> }) {
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

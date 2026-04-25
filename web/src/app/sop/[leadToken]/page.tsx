import { Suspense } from "react";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { SopEditor } from "./SopEditor";
import type { SopEditorLead, SopEditorDraft } from "./SopEditor";
import { NotFoundFallback } from "@/components/matches/NotFoundFallback";
import { logger } from "@/lib/logger";

const log = logger.child({ route: "/sop/[leadToken]" });

// Mirrors /matches/[token]/page.tsx posture for Next 16 Cache Components.
// Dynamic params + uncached Supabase read → MUST live under <Suspense>.

interface PageProps {
  params: Promise<{ leadToken: string }>;
}

export default function SopPage({ params }: PageProps) {
  return (
    <Suspense fallback={<SopSkeleton />}>
      <SopContent params={params} />
    </Suspense>
  );
}

function SopSkeleton() {
  return (
    <main
      className="container mx-auto max-w-3xl px-4 pb-16"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mt-8 h-20 animate-pulse rounded-md bg-neutral-100" />
      <div className="mt-6 h-10 w-2/3 animate-pulse rounded-md bg-neutral-100" />
      <div className="mt-8 h-80 animate-pulse rounded-md bg-neutral-100" />
    </main>
  );
}

async function SopContent({
  params,
}: {
  params: Promise<{ leadToken: string }>;
}) {
  const { leadToken } = await params;
  const supabase = createServiceRoleClient();

  const { data: lead, error } = await supabase
    .from("leads")
    .select(
      "id, full_name, email, matches, match_token, preferred_fields, highest_qualification",
    )
    .eq("match_token", leadToken)
    .maybeSingle();

  if (error) {
    log.error({ leadToken, err: error.message }, "lookup failed");
    return <NotFoundFallback />;
  }
  if (!lead) {
    return <NotFoundFallback />;
  }

  // Latest existing sop_draft for this lead (if any).
  const { data: latestDraft } = await supabase
    .from("sop_drafts")
    .select("id, version_number, full_text, created_at, parent_draft_id")
    .eq("lead_id", lead.id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Full version history (most recent first) — sidebar.
  const { data: history } = await supabase
    .from("sop_drafts")
    .select("id, version_number, full_text, created_at, parent_draft_id")
    .eq("lead_id", lead.id)
    .order("version_number", { ascending: false });

  const leadProps: SopEditorLead = {
    leadToken,
    fullName: lead.full_name ?? "Student",
    matches: (lead.matches as SopEditorLead["matches"]) ?? null,
  };

  const initialDraft: SopEditorDraft | null = latestDraft
    ? {
        id: latestDraft.id,
        versionNumber: latestDraft.version_number,
        fullText: latestDraft.full_text,
        createdAt: latestDraft.created_at,
        parentDraftId: latestDraft.parent_draft_id ?? null,
      }
    : null;

  const historyProps: SopEditorDraft[] = (history ?? []).map((d) => ({
    id: d.id,
    versionNumber: d.version_number,
    fullText: d.full_text,
    createdAt: d.created_at,
    parentDraftId: d.parent_draft_id ?? null,
  }));

  return (
    <main className="container mx-auto max-w-4xl px-4 pb-16">
      <SopEditor
        lead={leadProps}
        initialDraft={initialDraft}
        initialHistory={historyProps}
      />
    </main>
  );
}

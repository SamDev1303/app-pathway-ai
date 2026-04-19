"use client";

interface PendingMatchesProps {
  leadId: string;
  email: string;
}

export function PendingMatches({ leadId, email }: PendingMatchesProps) {
  return (
    <main className="container mx-auto max-w-2xl py-16">
      <p className="eyebrow text-navy-950/60">STILL COMPUTING</p>
      <h1 className="font-display text-3xl text-navy-950 mt-2">
        We&rsquo;re still finding your matches
      </h1>
      <p className="text-navy-950/70 mt-4 leading-relaxed">
        Your enquiry is saved and our counsellors at {email.replace(/(.{2}).*(@.*)/, "$1••••$2")} have
        been notified. The uni ranking is still being crunched — check back in 30 seconds.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-navy-950 text-cream font-semibold px-5 py-3 hover:bg-navy-900"
      >
        Refresh
      </button>
      <p className="eyebrow text-navy-950/40 text-[10px] mt-6">Ref: {leadId.slice(0, 8)}</p>
    </main>
  );
}

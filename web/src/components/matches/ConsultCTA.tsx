const CONSULT_CTA_HREF = "/consult";

export function ConsultCTA() {
  return (
    <section className="paper-grain bg-cream border border-gold-500/30 rounded-lg p-6 mt-12">
      <p className="eyebrow text-navy-950/60">NEXT STEP</p>
      <h2 className="font-display text-2xl text-navy-950 mt-1">
        Talk through your shortlist with a Pathway-AI advisor
      </h2>
      <p className="text-navy-950/70 mt-3">
        We'll audit fees, scholarships, IELTS gaps, and next steps in a free
        30-minute session.
      </p>
      <a
        href={CONSULT_CTA_HREF}
        className="inline-flex items-center gap-2 rounded-md bg-gold-700 text-cream font-semibold px-5 py-3 mt-5 hover:bg-gold-800 transition"
      >
        Book your consultation →
      </a>
    </section>
  );
}

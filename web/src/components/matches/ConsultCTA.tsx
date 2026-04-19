import { MARA_CONSULT_CTA_HREF } from "@/lib/mara-disclaimer";

export function ConsultCTA() {
  return (
    <section className="paper-grain bg-cream border border-gold-500/30 rounded-lg p-6 mt-12">
      <p className="eyebrow text-navy-950/60">NEXT STEP</p>
      <h2 className="font-display text-2xl text-navy-950 mt-1">
        Bring your shortlist to our Liverpool office
      </h2>
      <p className="text-navy-950/70 mt-3">
        Our MARA-registered counsellors will audit fees, scholarships, IELTS gaps, and
        next steps in a free 30-minute session.
      </p>
      <a
        href={MARA_CONSULT_CTA_HREF}
        className="inline-flex items-center gap-2 rounded-md bg-gold-700 text-cream font-semibold px-5 py-3 mt-5 hover:bg-gold-800 transition"
      >
        Book your consultation →
      </a>
    </section>
  );
}

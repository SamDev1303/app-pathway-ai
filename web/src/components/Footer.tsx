import { brand, footer } from "@/lib/content";

export function Footer() {
  return (
    <footer
      id="book"
      className="bg-[var(--color-navy-950)] text-[var(--color-cream)] paper-grain"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-28 relative z-10">
        <div className="rail-gold w-32 mb-6" />
        <p className="eyebrow" style={{ color: "var(--color-gold-400)" }}>
          {footer.cta.eyebrow}
        </p>
        <h2 className="mt-3 font-display text-4xl md:text-6xl max-w-3xl leading-[1.05]">
          {footer.cta.headline}
        </h2>
        <p className="mt-6 max-w-2xl text-[var(--color-cream)]/85 text-base md:text-lg">
          {footer.cta.sub}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <a
            href={`mailto:${brand.email}?subject=Free%20consultation%20-%20UniMate`}
            className="inline-flex items-center justify-center gap-3 bg-[var(--color-gold-500)] hover:bg-[var(--color-gold-400)] text-[var(--color-navy-950)] px-8 py-4 font-display text-xl transition-colors duration-500"
          >
            {footer.cta.button}
            <span>→</span>
          </a>
          <a
            href={`tel:${brand.phone.replace(/\s/g, "")}`}
            className="inline-flex items-center justify-center gap-2 border border-[var(--color-cream)]/30 hover:border-[var(--color-gold-400)] text-[var(--color-cream)] px-8 py-4 font-display text-xl transition-colors"
          >
            {brand.phone}
          </a>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-10 pt-10 border-t border-[var(--color-cream)]/15">
          <div>
            <p className="eyebrow" style={{ color: "var(--color-gold-400)" }}>
              Office
            </p>
            <p className="mt-3 text-sm text-[var(--color-cream)]/85 leading-relaxed">
              {brand.address}
            </p>
          </div>
          <div>
            <p className="eyebrow" style={{ color: "var(--color-gold-400)" }}>
              Contact
            </p>
            <p className="mt-3 text-sm text-[var(--color-cream)]/85">
              {brand.email}
              <br />
              {brand.phone}
            </p>
          </div>
          <div>
            <p className="eyebrow" style={{ color: "var(--color-gold-400)" }}>
              Compliance
            </p>
            <p className="mt-3 text-sm text-[var(--color-cream)]/85 leading-relaxed">
              {brand.mara_number}
              <br />
              {brand.qeac_number}
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--color-cream)]/15 text-xs text-[var(--color-cream)]/55 space-y-1">
          {footer.legal.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </footer>
  );
}

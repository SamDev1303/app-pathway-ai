import { trust } from "@/lib/content";

export function TrustStrip() {
  return (
    <section className="bg-[var(--color-ivory)] paper-grain py-16 md:py-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="rail-gold w-32 mx-auto mb-6" />
        <p className="eyebrow text-center">{trust.eyebrow}</p>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-10 md:gap-16 items-start">
          {trust.credentials.map((c) => (
            <div key={c.label} className="text-center">
              <p
                className="font-display text-4xl md:text-5xl"
                style={{ color: "var(--color-navy-950)" }}
              >
                {c.label}
              </p>
              <p className="mt-2 text-sm font-mono tracking-tight text-[var(--color-navy-700)]">
                {c.number}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-navy-500)]">
                {c.caption}
              </p>
            </div>
          ))}
        </div>
        <div className="rail-gold w-32 mx-auto mt-10" />
        <p className="text-center mt-6 italic font-display text-xl md:text-2xl text-[var(--color-navy-950)]">
          {trust.tagline}
        </p>
      </div>
    </section>
  );
}

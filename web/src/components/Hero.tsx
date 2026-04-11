import Image from "next/image";
import { hero, brand } from "@/lib/content";

export function Hero() {
  return (
    <section className="relative min-h-[560px] md:min-h-[720px] md:h-[100svh] md:max-h-[920px] w-full overflow-hidden bg-[var(--color-navy-950)]">
      <Image
        src="https://images.unsplash.com/photo-1523428096881-5bd79d043006?w=2000&q=85"
        alt="Sydney harbour at golden hour"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(13,26,61,0.55) 0%, rgba(13,26,61,0.25) 35%, rgba(13,26,61,0.85) 100%)",
        }}
      />

      <div className="absolute inset-0 paper-grain pointer-events-none opacity-60" />

      <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl text-[var(--color-cream)]">
            {brand.name}
          </span>
          <span
            className="text-xs uppercase tracking-[0.3em]"
            style={{ color: "var(--color-gold-400)" }}
          >
            {brand.tagline}
          </span>
        </div>
        <div className="flex items-center gap-4 md:gap-8 text-sm text-[var(--color-cream)]/85">
          <a href="#match" className="hover:text-[var(--color-gold-400)] transition-colors">Match</a>
          <a href="#book" className="hover:text-[var(--color-gold-400)] transition-colors hidden sm:inline">Book office</a>
          <a
            href="#book"
            className="sm:hidden border border-[var(--color-gold-400)] text-[var(--color-gold-400)] px-3 py-1.5 text-xs font-display"
          >
            Book
          </a>
        </div>
      </nav>

      <div className="absolute bottom-8 md:bottom-20 left-5 md:left-12 right-5 md:right-12 z-10 max-w-5xl">
        <div className="hidden lg:block absolute -top-12 right-0 text-right">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-gold-400)]">
            {hero.metadata.title}
          </p>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-cream)]/65 mt-1">
            {hero.metadata.location} · {hero.metadata.since}
          </p>
        </div>
        <div className="rail-gold w-32 mb-6" />
        <p className="eyebrow mb-5">{hero.eyebrow}</p>
        <h1 className="font-display text-[2.75rem] sm:text-6xl md:text-7xl lg:text-8xl text-[var(--color-cream)] leading-[0.95] mask-reveal">
          {hero.headline}
          <br />
          <em className="italic" style={{ color: "var(--color-gold-400)" }}>
            {hero.headlineEm}
          </em>
        </h1>
        <p className="mt-6 text-base md:text-lg text-[var(--color-cream)]/85 max-w-xl fade-up">
          {hero.subhead}
        </p>
        <div className="mt-8 flex items-center gap-6 fade-up" style={{ animationDelay: "0.3s" }}>
          <a
            href="#match"
            className="inline-flex items-center gap-3 bg-[var(--color-gold-500)] hover:bg-[var(--color-gold-400)] text-[var(--color-navy-950)] px-7 py-4 font-display text-xl transition-colors duration-500"
            style={{ transitionTimingFunction: "var(--ease-editorial)" }}
          >
            Find your match
            <span>↓</span>
          </a>
          <a
            href="#book"
            className="text-[var(--color-cream)]/90 hover:text-[var(--color-gold-400)] underline underline-offset-4 decoration-[var(--color-gold-500)]/40 hover:decoration-[var(--color-gold-400)] text-sm transition-colors"
          >
            Or book the Liverpool office →
          </a>
        </div>
      </div>
    </section>
  );
}

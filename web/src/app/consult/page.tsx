import Link from "next/link";
import { brand } from "@/lib/content";

export const metadata = {
 title: "Book a consultation — Pathway-AI",
 description:
 "Book a free consultation with a Pathway-AI advisor.",
};

export default function ConsultPage() {
 return (
 <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)]">
 <div className="mx-auto max-w-2xl px-6 py-24">
 <p className="eyebrow text-[var(--color-gold-700)]">
 Free consultation
 </p>
 <h1 className="mt-4 font-display text-5xl leading-tight">
 Talk to a Pathway-AI advisor.
 </h1>
 <p className="mt-6 text-lg text-[var(--color-ink)]/75 leading-relaxed">
 Pathway-AI is an information and matching service for Australian
 universities. For binding visa, migration, or post-study work advice,
 we will refer you to a licensed migration agent.
 </p>

 <div className="mt-10 rounded-2xl border border-[var(--color-ink)]/10 bg-white p-8 shadow-sm">
 <p className="eyebrow text-[var(--color-ink)]/60">Contact</p>
 <p className="mt-1 text-base text-[var(--color-ink)]">
 {brand.email}
 </p>

 <div className="mt-8 flex flex-col sm:flex-row gap-3">
 <a
 href={`mailto:${brand.email}?subject=Pathway-AI%20%E2%80%94%20consultation%20request`}
 className="inline-flex items-center justify-center rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm font-medium text-[var(--color-cream)] hover:opacity-90"
 >
 Email to book
 </a>
 <Link
 href="/"
 className="inline-flex items-center justify-center rounded-full border border-[var(--color-ink)]/20 px-6 py-3 text-sm font-medium hover:bg-[var(--color-ink)]/5"
 >
 Back to Pathway-AI
 </Link>
 </div>
 </div>

 <p className="mt-10 text-xs text-[var(--color-ink)]/55 italic leading-relaxed">
 Pathway-AI provides educational information about Australian
 universities and courses. It is not migration or visa advice.
 Consult a licensed migration agent for any regulated question.
 </p>
 </div>
 </main>
 );
}

import Link from "next/link";
import { brand } from "@/lib/content";

export const metadata = {
 title: "Book a consultation — Pathway-AI",
 description:
 "Book a free consultation with a registered migration agent at Pathway-AI, .",
};

export default function ConsultPage() {
 return (
 <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)]">
 <div className="mx-auto max-w-2xl px-6 py-24">
 <p className="eyebrow text-[var(--color-gold-700)]">
 registered consultation
 </p>
 <h1 className="mt-4 font-display text-5xl leading-tight">
 Talk to a real migration agent.
 </h1>
 <p className="mt-6 text-lg text-[var(--color-ink)]/75 leading-relaxed">
 Pathway-AI is an information and matching service. It is not migration
 advice. For binding eligibility, visa pathway, or post-study work
 questions, book a free consultation with a registered advisor at{" "}
 {brand.poweredBy.replace(/^Powered by /, "")} in {brand.city}.
 </p>

 <div className="mt-10 rounded-2xl border border-[var(--color-ink)]/10 bg-white p-8 shadow-sm">
 <p className="eyebrow text-[var(--color-ink)]/60">Office</p>
 <p className="mt-2 text-base text-[var(--color-ink)]">
 {brand.address}
 </p>
 <p className="mt-1 text-base text-[var(--color-ink)]">
 {brand.email}
 </p>

 <div className="mt-8 flex flex-col sm:flex-row gap-3">
 <a
 href={`mailto:${brand.email}?subject=Atlas%20AI%20%E2%80%94%20consultation%20request`}
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
 Migration advice is regulated under the Migration Act 1958 (Cth).
 Only registered agents may provide it. Pathway-AI does not, and
 will refer you here for any regulated question.
 </p>
 </div>
 </main>
 );
}

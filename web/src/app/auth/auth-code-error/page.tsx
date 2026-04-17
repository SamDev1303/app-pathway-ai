import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)] paper-grain px-6">
      <div className="max-w-md text-center">
        <p
          className="eyebrow"
          style={{ color: "var(--color-gold-500)" }}
        >
          Sign-in link issue
        </p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl text-[var(--color-navy-950)] leading-[1.1]">
          That link didn&apos;t work.
        </h1>
        <p className="mt-5 text-[var(--color-navy-700)] leading-relaxed">
          Magic links expire after a short window. Request a fresh one and we&apos;ll
          email it right away.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block bg-[var(--color-navy-950)] hover:bg-[var(--color-navy-900)] text-[var(--color-cream)] px-8 py-4 font-display text-lg transition-colors duration-300"
        >
          Request a new link →
        </Link>
      </div>
    </div>
  );
}

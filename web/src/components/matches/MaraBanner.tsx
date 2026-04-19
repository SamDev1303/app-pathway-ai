import {
  MARA_DISCLAIMER_BODY,
  MARA_DISCLAIMER_EYEBROW,
  MARA_CONSULT_CTA_LABEL,
  MARA_CONSULT_CTA_HREF,
} from "@/lib/mara-disclaimer";

interface MaraBannerProps {
  variant?: "top" | "footer";
}

export function MaraBanner({ variant = "top" }: MaraBannerProps) {
  const padded = variant === "top" ? "mt-6 mb-8" : "mt-12 mb-6";
  return (
    <aside
      role="note"
      aria-label="MARA disclaimer"
      className={`rail-gold paper-grain bg-cream/90 border-y border-gold-500/30 px-5 py-4 ${padded}`}
    >
      <p className="eyebrow mb-1 text-navy-950/60">{MARA_DISCLAIMER_EYEBROW}</p>
      <p className="text-navy-950 leading-relaxed">
        {MARA_DISCLAIMER_BODY}{" "}
        <a
          href={MARA_CONSULT_CTA_HREF}
          className="font-semibold text-gold-700 underline underline-offset-4 hover:text-gold-800"
        >
          {MARA_CONSULT_CTA_LABEL} →
        </a>
      </p>
    </aside>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LeadInput } from "@/lib/lead-schema";
import {
 CONSENT_WORDING_VERSION,
 LEAD_DRAFT_SCHEMA_VERSION,
 LEAD_DRAFT_STORAGE_KEY,
 LEAD_DRAFT_TTL_DAYS,
} from "@/lib/lead-schema";
import { Step1Personal } from "./lead/Step1Personal";
import { Step2Academic } from "./lead/Step2Academic";
import { Step3Preferences } from "./lead/Step3Preferences";
import { Step4Budget } from "./lead/Step4Budget";
import { Step5Contact } from "./lead/Step5Contact";

type Status = "idle" | "submitting" | "success" | "error";
type StepNumber = 1 | 2 | 3 | 4 | 5;

interface DraftEnvelope {
 values: Partial<LeadInput>;
 currentStep: StepNumber;
 saved_at: string;
 schema_version: typeof LEAD_DRAFT_SCHEMA_VERSION;
}

const STEP_LABELS: Record<StepNumber, string> = {
 1: "Personal",
 2: "Academic",
 3: "Preferences",
 4: "Budget",
 5: "Contact",
};

function isStepValid(step: StepNumber, values: Partial<LeadInput>): boolean {
 if (step === 1) {
 return (
 (values.full_name?.length ?? 0) >= 2 &&
 /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email ?? "") &&
 (values.phone?.length ?? 0) >= 6 &&
 (values.country?.length ?? 0) >= 2
 );
 }
 if (step === 5) {
 return values.consent_service === true;
 }
 return true;
}

/**
 * TODO(human) — implement draft persistence + hydration.
 *
 * Goal: manage the localStorage draft lifecycle for the 5-step wizard.
 * This function is called by the LeadModal effect chain. Return the
 * hydrated { values, currentStep } if a valid draft exists, or `null`
 * if no usable draft is found.
 *
 * Rules (from 3-CONTEXT.md D7):
 * - Key: LEAD_DRAFT_STORAGE_KEY (already imported)
 * - Shape must parse to DraftEnvelope
 * - Ignore (and clear) drafts where `schema_version !== LEAD_DRAFT_SCHEMA_VERSION`
 * — silently, no user-facing message
 * - Ignore (and clear) drafts where `saved_at` is older than
 * LEAD_DRAFT_TTL_DAYS (default 30) — silently
 * - If draft is valid, return { values, currentStep } so the caller can
 * rehydrate the form + show the "Picking up where you left off" banner
 * - On any JSON parse error: clear the key and return null (never throw
 * into the UI — stale drafts shouldn't break the form on mount)
 * - SSR safety: this runs client-side only (called from useEffect) so
 * `window.localStorage` is safe, but add a `typeof window === "undefined"`
 * guard anyway as a belt-and-braces check
 *
 * Why you: this encodes the consent + privacy tradeoff you've been wrestling
 * with — 30 days is long enough to feel recovered-from-elsewhere and short
 * enough that stale PII doesn't linger on borrowed devices. The silent
 * cross-version invalidation means future schema bumps don't need a user-
 * facing migration UI. Those are YOUR calls and worth owning in code.
 *
 * Signature: (ttlDays: number) => { values: Partial<LeadInput>; currentStep: StepNumber } | null
 */
function loadDraft(ttlDays: number): {
 values: Partial<LeadInput>;
 currentStep: StepNumber;
} | null {
 if (typeof window === "undefined") return null;

 const raw = window.localStorage.getItem(LEAD_DRAFT_STORAGE_KEY);
 if (!raw) return null;

 let parsed: Partial<DraftEnvelope>;
 try {
 parsed = JSON.parse(raw) as Partial<DraftEnvelope>;
 } catch {
 clearDraft();
 return null;
 }

 if (parsed.schema_version !== LEAD_DRAFT_SCHEMA_VERSION) {
 clearDraft();
 return null;
 }

 const savedAt = Date.parse(parsed.saved_at ?? "");
 if (!Number.isFinite(savedAt)) {
 clearDraft();
 return null;
 }
 const ageMs = Date.now() - savedAt;
 if (ageMs > ttlDays * 24 * 60 * 60 * 1000) {
 clearDraft();
 return null;
 }

 if (!parsed.values || typeof parsed.values !== "object") {
 clearDraft();
 return null;
 }

 const step = parsed.currentStep;
 const currentStep: StepNumber =
 step === 1 || step === 2 || step === 3 || step === 4 || step === 5 ? step : 1;

 return { values: parsed.values, currentStep };
}

function saveDraft(values: Partial<LeadInput>, currentStep: StepNumber): void {
 if (typeof window === "undefined") return;
 const envelope: DraftEnvelope = {
 values,
 currentStep,
 saved_at: new Date().toISOString(),
 schema_version: LEAD_DRAFT_SCHEMA_VERSION,
 };
 try {
 window.localStorage.setItem(LEAD_DRAFT_STORAGE_KEY, JSON.stringify(envelope));
 } catch {
 /* ignore quota / privacy-mode errors — draft persistence is best-effort */
 }
}

function clearDraft(): void {
 if (typeof window === "undefined") return;
 try {
 window.localStorage.removeItem(LEAD_DRAFT_STORAGE_KEY);
 } catch {
 /* ignore */
 }
}

export function LeadModal({
 open,
 onClose,
 source = "footer",
}: {
 open: boolean;
 onClose: () => void;
 source?: string;
}) {
 const [step, setStep] = useState<StepNumber>(1);
 const [direction, setDirection] = useState<1 | -1>(1);
 const [values, setValues] = useState<Partial<LeadInput>>({
 consent_marketing: false,
 });
 const [status, setStatus] = useState<Status>("idle");
 const [errorMsg, setErrorMsg] = useState("");
 const [draftBannerShown, setDraftBannerShown] = useState(false);
 const [draftBannerDismissed, setDraftBannerDismissed] = useState(false);

 useEffect(() => {
 if (!open) return;
 const hydrated = loadDraft(LEAD_DRAFT_TTL_DAYS);
 if (hydrated) {
 setValues((prev) => ({ ...prev, ...hydrated.values }));
 setStep(hydrated.currentStep);
 setDraftBannerShown(true);
 }
 }, [open]);

 useEffect(() => {
 if (!open) return;
 const onKey = (e: KeyboardEvent) => {
 if (e.key === "Escape") handleClose();
 };
 window.addEventListener("keydown", onKey);
 document.body.style.overflow = "hidden";
 return () => {
 window.removeEventListener("keydown", onKey);
 document.body.style.overflow = "";
 };
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [open]);

 useEffect(() => {
 if (!open || status === "success") return;
 const t = setTimeout(() => saveDraft(values, step), 300);
 return () => clearTimeout(t);
 }, [values, step, open, status]);

 const reset = () => {
 setValues({ consent_marketing: false });
 setStep(1);
 setStatus("idle");
 setErrorMsg("");
 setDraftBannerShown(false);
 setDraftBannerDismissed(false);
 };

 const handleClose = useCallback(() => {
 onClose();
 setTimeout(() => {
 if (status === "success") reset();
 }, 300);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [onClose, status]);

 const patchValues = useCallback((patch: Partial<LeadInput>) => {
 setValues((prev) => ({ ...prev, ...patch }));
 }, []);

 const goNext = () => {
 if (step < 5) {
 setDirection(1);
 setStep((step + 1) as StepNumber);
 }
 };

 const goBack = () => {
 if (step > 1) {
 setDirection(-1);
 setStep((step - 1) as StepNumber);
 }
 };

 const submit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!isStepValid(5, values)) {
 setErrorMsg("Please accept the service consent to continue.");
 return;
 }
 setErrorMsg("");
 setStatus("submitting");
 try {
 const res = await fetch("/api/leads", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 ...values,
 consent_service: true,
 consent_marketing: values.consent_marketing ?? false,
 consent_wording_version: CONSENT_WORDING_VERSION,
 source,
 user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
 locale: typeof navigator !== "undefined" ? navigator.language : undefined,
 }),
 });
 const data = await res.json();
 if (!res.ok || !data.ok) {
 setStatus("error");
 setErrorMsg(data.error ?? "Something went wrong. Please try again.");
 return;
 }
 setStatus("success");
 clearDraft();
 // Smart-client demo path: as soon as the lead row + match_token come
 // back, jump straight to the ranked /matches/[token] page so the
 // student sees their ranked universities, not a generic "thanks" card.
 // The success render still appears for the brief navigation gap.
 if (typeof window !== "undefined" && typeof data.match_token === "string") {
 window.location.assign(`/matches/${data.match_token}`);
 }
 } catch {
 setStatus("error");
 setErrorMsg("Network issue. Please try again or call our office.");
 }
 };

 const stepValid = useMemo(() => isStepValid(step, values), [step, values]);

 return (
 <AnimatePresence>
 {open ? (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.25 }}
 className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8"
 style={{ backgroundColor: "rgba(8,16,40,0.72)", backdropFilter: "blur(8px)" }}
 onClick={handleClose}
 >
 <motion.div
 initial={{ y: 30, opacity: 0, scale: 0.96 }}
 animate={{ y: 0, opacity: 1, scale: 1 }}
 exit={{ y: 20, opacity: 0, scale: 0.97 }}
 transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
 className="relative w-full max-w-2xl bg-[var(--color-cream)] paper-grain max-h-[92vh] overflow-y-auto"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="rail-gold w-24 mt-8 ml-8 md:ml-10" />
 <div className="px-8 md:px-10 pt-4 pb-10">
 <div className="flex items-start justify-between gap-4">
 <div>
 <p className="eyebrow" style={{ color: "var(--color-gold-500)" }}>
 Free consultation
 </p>
 <h2 className="mt-2 font-display text-3xl md:text-4xl text-[var(--color-navy-950)] leading-[1.1]">
 {status === "success" ? "Got it." : "Bring your match to Liverpool."}
 </h2>
 </div>
 <button
 type="button"
 aria-label="Close"
 onClick={handleClose}
 className="text-[var(--color-navy-950)]/60 hover:text-[var(--color-navy-950)] text-xl leading-none mt-2"
 >
 ✕
 </button>
 </div>

 {status === "success" ? (
 <div className="mt-6 rounded-lg border border-[var(--color-gold-500)]/40 bg-[var(--color-gold-500)]/10 p-5">
 <p className="mt-2 text-sm text-[var(--color-navy-950)]/80 leading-relaxed">
 Your enquiry is on its way to our office. A registered counsellor
 will call you within one business day.
 </p>
 <button
 type="button"
 onClick={handleClose}
 className="mt-5 inline-flex items-center gap-2 bg-[var(--color-navy-950)] text-[var(--color-cream)] px-5 py-3 font-display text-base"
 >
 Close
 </button>
 </div>
 ) : (
 <>
 <ProgressIndicator step={step} />

 {draftBannerShown && !draftBannerDismissed ? (
 <div className="mt-4 flex items-start justify-between gap-3 rounded-md border border-[var(--color-navy-950)]/15 bg-[var(--color-navy-950)]/[0.03] px-3 py-2.5">
 <p className="text-xs text-[var(--color-navy-950)]/80 leading-snug">
 Picking up where you left off — saved on this device only.
 </p>
 <button
 type="button"
 onClick={() => setDraftBannerDismissed(true)}
 className="text-[var(--color-navy-950)]/50 hover:text-[var(--color-navy-950)] text-sm"
 >
 ✕
 </button>
 </div>
 ) : null}

 <form onSubmit={submit} className="mt-5">
 <AnimatePresence mode="wait" initial={false} custom={direction}>
 <motion.div
 key={step}
 custom={direction}
 initial={{ x: direction > 0 ? 30 : -30, opacity: 0 }}
 animate={{ x: 0, opacity: 1 }}
 exit={{ x: direction > 0 ? -30 : 30, opacity: 0 }}
 transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
 >
 {step === 1 ? <Step1Personal values={values} onChange={patchValues} /> : null}
 {step === 2 ? <Step2Academic values={values} onChange={patchValues} /> : null}
 {step === 3 ? <Step3Preferences values={values} onChange={patchValues} /> : null}
 {step === 4 ? <Step4Budget values={values} onChange={patchValues} /> : null}
 {step === 5 ? <Step5Contact values={values} onChange={patchValues} /> : null}
 </motion.div>
 </AnimatePresence>

 {errorMsg ? (
 <p className="mt-4 text-sm text-red-700">{errorMsg}</p>
 ) : null}

 <div className="mt-6 flex items-center justify-between gap-3">
 {step > 1 ? (
 <button
 type="button"
 onClick={goBack}
 className="text-sm text-[var(--color-navy-950)]/70 hover:text-[var(--color-navy-950)] transition-colors"
 >
 ← Back
 </button>
 ) : <span />}

 <div className="flex items-center gap-4">
 {step > 1 && step < 5 ? (
 <button
 type="button"
 onClick={goNext}
 className="text-sm text-[var(--color-navy-950)]/60 hover:text-[var(--color-navy-950)] underline-offset-4 hover:underline transition-colors"
 >
 Skip this step
 </button>
 ) : null}

 {step < 5 ? (
 <button
 type="button"
 onClick={goNext}
 disabled={!stepValid}
 className="bg-[var(--color-gold-500)] hover:bg-[var(--color-gold-400)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-navy-950)] px-6 py-3 font-display text-base transition-colors"
 >
 Next →
 </button>
 ) : (
 <button
 type="submit"
 disabled={status === "submitting" || !stepValid}
 className="bg-[var(--color-gold-500)] hover:bg-[var(--color-gold-400)] disabled:opacity-60 disabled:cursor-not-allowed text-[var(--color-navy-950)] px-6 py-4 font-display text-lg transition-colors"
 >
 {status === "submitting" ? "Sending…" : "Submit enquiry"}
 </button>
 )}
 </div>
 </div>

 <p className="text-[10px] text-[var(--color-navy-950)]/55 text-center pt-4">
 Pathway-AI · QEAC-certified counsellor on staff
 </p>
 </form>
 </>
 )}
 </div>
 </motion.div>
 </motion.div>
 ) : null}
 </AnimatePresence>
 );
}

function ProgressIndicator({ step }: { step: StepNumber }) {
 return (
 <div className="mt-5">
 <div className="flex items-center gap-1.5 md:hidden">
 {([1, 2, 3, 4, 5] as const).map((n) => (
 <span
 key={n}
 className={`inline-block h-1.5 flex-1 rounded-full transition-colors ${
 n <= step
 ? "bg-[var(--color-gold-500)]"
 : "bg-[var(--color-navy-950)]/15"
 }`}
 />
 ))}
 <span className="ml-2 text-[11px] uppercase tracking-[0.15em] text-[var(--color-navy-950)]/60 whitespace-nowrap">
 {step} / 5
 </span>
 </div>

 <div className="hidden md:flex items-center gap-3 text-[11px] uppercase tracking-[0.15em]">
 {([1, 2, 3, 4, 5] as const).map((n, idx, arr) => (
 <span key={n} className="flex items-center gap-3">
 <span
 className={
 n === step
 ? "text-[var(--color-gold-500)] font-semibold"
 : n < step
 ? "text-[var(--color-navy-950)]/70"
 : "text-[var(--color-navy-950)]/35"
 }
 >
 {STEP_LABELS[n]}
 </span>
 {idx < arr.length - 1 ? (
 <span className="text-[var(--color-navy-950)]/20">·</span>
 ) : null}
 </span>
 ))}
 </div>
 </div>
 );
}

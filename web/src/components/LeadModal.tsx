"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Status = "idle" | "submitting" | "success" | "error";

export function LeadModal({
  open,
  onClose,
  source = "footer"
}: {
  open: boolean;
  onClose: () => void;
  source?: string;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [consentService, setConsentService] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const reset = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setConsentService(false);
    setConsentMarketing(false);
    setStatus("idle");
    setErrorMsg("");
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentService) {
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
          full_name: fullName,
          email,
          phone,
          message,
          consent_service: true,
          consent_marketing: consentMarketing,
          consent_wording_version: "2026-04-17.v1",
          source
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Network issue. Please try again or call our Liverpool office.");
    }
  };

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
            className="relative w-full max-w-lg bg-[var(--color-cream)] paper-grain max-h-[92vh] overflow-y-auto"
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
                    Bring your match to Liverpool.
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
                  <p className="font-display text-2xl text-[var(--color-navy-950)]">Got it.</p>
                  <p className="mt-2 text-sm text-[var(--color-navy-950)]/80 leading-relaxed">
                    Your enquiry is on its way to our Liverpool office. A MARA-registered counsellor will call you within one business day.
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
                <form onSubmit={submit} className="mt-6 space-y-4">
                  <Field label="Full name" required>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      minLength={2}
                      maxLength={120}
                      className="w-full bg-white border border-[var(--color-navy-950)]/15 px-4 py-3 text-[var(--color-navy-950)] focus:border-[var(--color-gold-500)] outline-none transition-colors"
                    />
                  </Field>

                  <Field label="Email" required>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-white border border-[var(--color-navy-950)]/15 px-4 py-3 text-[var(--color-navy-950)] focus:border-[var(--color-gold-500)] outline-none transition-colors"
                    />
                  </Field>

                  <Field label="Phone (with country code)" required>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="+61 4XX XXX XXX"
                      className="w-full bg-white border border-[var(--color-navy-950)]/15 px-4 py-3 text-[var(--color-navy-950)] focus:border-[var(--color-gold-500)] outline-none transition-colors"
                    />
                  </Field>

                  <Field label="What's your situation?">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={2000}
                      rows={4}
                      placeholder="Country, study level, IELTS, target intake — whatever helps us prepare."
                      className="w-full bg-white border border-[var(--color-navy-950)]/15 px-4 py-3 text-[var(--color-navy-950)] focus:border-[var(--color-gold-500)] outline-none transition-colors resize-none"
                    />
                  </Field>

                  <div className="text-[11px] text-[var(--color-navy-950)]/70 pt-2 leading-relaxed space-y-2">
                    <p>
                      <span className="font-semibold">Collection notice (APP 5).</span> UniMate Australia (MARN 1798425, QEAC P538, Liverpool NSW) collects the information on this form so our MARA-registered counsellors can contact you about your enquiry.
                    </p>
                    <p>
                      <span className="font-semibold">Why we need it.</span> Your name, email, and phone are required to respond to you. Declining means we cannot follow up on your enquiry.
                    </p>
                    <p>
                      <span className="font-semibold">Who we share it with.</span> Your details stay with UniMate&apos;s counsellors and the service providers who help us operate this platform (email + database hosting). We do not sell or disclose your information to third-party marketers. Disclosure may occur where required by Australian law.
                    </p>
                    <p>
                      <span className="font-semibold">Your rights.</span> You can request access or correction, or ask us to delete your record, by emailing <a className="underline" href="mailto:privacy@unimate.com.au">privacy@unimate.com.au</a>. Our full APP Privacy Policy is available on request.
                    </p>
                    <p>
                      We handle your data under the <em>Privacy Act 1988 (Cth)</em>.
                    </p>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentService}
                      onChange={(e) => setConsentService(e.target.checked)}
                      className="mt-1 accent-[var(--color-gold-500)] w-4 h-4"
                      required
                    />
                    <span className="text-xs text-[var(--color-navy-950)]/80 leading-relaxed">
                      <span className="font-semibold">Required:</span> I consent to UniMate Australia contacting me about my course enquiry so a MARA-registered counsellor can follow up.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentMarketing}
                      onChange={(e) => setConsentMarketing(e.target.checked)}
                      className="mt-1 accent-[var(--color-gold-500)] w-4 h-4"
                    />
                    <span className="text-xs text-[var(--color-navy-950)]/70 leading-relaxed">
                      <span className="font-semibold">Optional:</span> Send me occasional updates about scholarships, intake deadlines, and open days.
                    </span>
                  </label>

                  {errorMsg ? (
                    <p className="text-sm text-red-700">{errorMsg}</p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full bg-[var(--color-gold-500)] hover:bg-[var(--color-gold-400)] disabled:opacity-60 text-[var(--color-navy-950)] px-6 py-4 font-display text-xl transition-colors duration-300 mt-2"
                  >
                    {status === "submitting" ? "Sending…" : "Request my free consultation →"}
                  </button>

                  <p className="text-[10px] text-[var(--color-navy-950)]/55 text-center pt-1">
                    MARN 1798425 · QEAC P538 · ABN 12 345 678 901
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Field({
  label,
  required,
  children
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.15em] text-[var(--color-navy-950)]/70 mb-2 font-medium">
        {label}
        {required ? <span className="text-[var(--color-gold-500)]"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

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
  const [consent, setConsent] = useState(false);
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
    setConsent(false);
    setStatus("idle");
    setErrorMsg("");
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setErrorMsg("Please accept the privacy notice to continue.");
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
          consent: true,
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

                  <label className="flex items-start gap-3 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-1 accent-[var(--color-gold-500)] w-4 h-4"
                      required
                    />
                    <span className="text-xs text-[var(--color-navy-950)]/75 leading-relaxed">
                      I consent to UniMate Australia contacting me about my study and migration enquiry. We handle your data under the
                      <em> Privacy Act 1988 (Cth)</em>. We will never share your details with third parties without your written consent.
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

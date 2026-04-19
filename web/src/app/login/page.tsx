"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    setErrorMsg("");

    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)] paper-grain px-6">
      <div className="max-w-md w-full">
        <div className="rail-gold w-20 mb-5" />
        <p className="eyebrow" style={{ color: "var(--color-gold-500)" }}>
          Atlas AI · Sign in
        </p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl text-[var(--color-navy-950)] leading-[1.05]">
          We&apos;ll email you a link.
        </h1>
        <p className="mt-5 text-[var(--color-navy-700)] leading-relaxed">
          No passwords. Type your email, check your inbox, click the link.
          Session stays signed in on this device until you sign out.
        </p>

        {status === "sent" ? (
          <div className="mt-8 border border-[var(--color-gold-500)]/40 bg-[var(--color-gold-500)]/10 p-6">
            <p className="font-display text-2xl text-[var(--color-navy-950)]">
              Check your email.
            </p>
            <p className="mt-2 text-sm text-[var(--color-navy-700)] leading-relaxed">
              We sent a sign-in link to <span className="font-semibold">{email}</span>.
              Click it from the same browser and device to complete sign-in.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatus("idle");
                setEmail("");
              }}
              className="mt-4 text-sm underline text-[var(--color-navy-700)] hover:text-[var(--color-navy-950)]"
            >
              Try a different email
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="block text-xs uppercase tracking-[0.15em] text-[var(--color-navy-950)]/70 mb-2 font-medium">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-white border border-[var(--color-navy-950)]/15 px-4 py-3 text-[var(--color-navy-950)] focus:border-[var(--color-gold-500)] outline-none transition-colors"
              />
            </label>

            {errorMsg ? (
              <p className="text-sm text-red-700">{errorMsg}</p>
            ) : null}

            <button
              type="submit"
              disabled={status === "sending" || !email}
              className="w-full bg-[var(--color-navy-950)] hover:bg-[var(--color-navy-900)] disabled:opacity-50 text-[var(--color-cream)] px-6 py-4 font-display text-xl transition-colors duration-300"
            >
              {status === "sending" ? "Sending…" : "Email me a sign-in link →"}
            </button>

            <p className="text-[10px] text-[var(--color-navy-950)]/55 text-center pt-1">
              Atlas AI uses Supabase Auth for sign-in. Your email is stored with
              UniMate (MARN [PENDING_FROM_UNIMATE]) per the Privacy Act 1988 (Cth).
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

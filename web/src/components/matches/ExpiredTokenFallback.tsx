"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ExpiredTokenFallbackProps {
  email: string;
  token: string;
}

export function ExpiredTokenFallback({ email, token }: ExpiredTokenFallbackProps) {
  const [requested, setRequested] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestLink() {
    setBusy(true);
    setErr(null);
    try {
      const supabase = createClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=/matches/${token}`
          : undefined;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        setErr(error.message);
        setBusy(false);
        return;
      }
      setRequested(true);
      setBusy(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unknown error");
      setBusy(false);
    }
  }

  return (
    <main className="container mx-auto max-w-2xl py-16">
      <p className="eyebrow text-navy-950/60">LINK EXPIRED</p>
      <h1 className="font-display text-3xl text-navy-950 mt-2">
        Your preview has expired
      </h1>
      <p className="text-navy-950/70 mt-4 leading-relaxed">
        Your matches are saved to your account. Enter your email and we&rsquo;ll send you
        a fresh link to view them.
      </p>
      {requested ? (
        <div className="mt-6 rounded-md bg-cream p-4 border border-gold-500/30">
          <p className="font-semibold text-navy-950">Check your email.</p>
          <p className="text-navy-950/70 text-sm mt-1">
            We sent a magic link to <strong>{email.replace(/(.{2}).*(@.*)/, "$1••••$2")}</strong>.
            Click it to return to your matches.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={requestLink}
          disabled={busy}
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-navy-950 text-cream font-semibold px-5 py-3 hover:bg-navy-900 disabled:opacity-50"
        >
          {busy ? "Sending…" : "Email me a fresh link"}
        </button>
      )}
      {err && (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {err}
        </p>
      )}
    </main>
  );
}

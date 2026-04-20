"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { SourcesPill, type RetrievedCourse } from "./SourcesPill";

const SUGGESTED = [
  "What IELTS score do I need for UNSW?",
  "Which Australian universities have the strongest IT programs?",
  "How much does a Master of IT cost?",
  "How do I compare Group of Eight vs regional universities?",
];

type MessageMeta = {
  retrievedCourses?: RetrievedCourse[];
  deflected?: boolean;
  rateLimited?: boolean;
  noHits?: boolean;
};

export function ChatClient({ mode }: { mode: "drawer" | "page" }) {
  const { messages, sendMessage, status, stop } = useChat();
  const [input, setInput] = useState("");

  function submit(text: string) {
    if (!text.trim()) return;
    sendMessage({ text });
    setInput("");
  }

  const padX = mode === "page" ? "px-6 md:px-12" : "px-6 md:px-8";

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className={`flex-1 overflow-y-auto ${padX} py-6 space-y-5`}>
        {messages.length === 0 && (
          <div>
            <p className="text-sm text-[var(--color-navy-700)] mb-4">
              Suggested questions:
            </p>
            <div className="grid gap-2">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => submit(q)}
                  className="text-left text-sm px-4 py-3 border border-[var(--color-navy-100)] hover:border-[var(--color-gold-500)] hover:bg-[var(--color-ivory)] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-navy-500)] mt-6">
              Educational information only. For migration advice, book a free consultation.
            </p>
          </div>
        )}

        {messages.map((m) => {
          const meta = (m.metadata ?? {}) as MessageMeta;
          return (
            <div
              key={m.id}
              className={`max-w-[88%] ${m.role === "user" ? "ml-auto" : "mr-auto"}`}
            >
              <p
                className={`text-[10px] uppercase tracking-wider mb-1 ${m.role === "user" ? "text-right text-[var(--color-navy-500)]" : "text-[var(--color-gold-600)]"}`}
              >
                {m.role === "user" ? "You" : "UniMate AI"}
              </p>
              <div
                className={`px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-[var(--color-navy-950)] text-[var(--color-cream)]"
                    : "bg-[var(--color-ivory)] text-[var(--color-navy-950)] border border-[var(--color-navy-100)]"
                }`}
              >
                {m.parts.map((p, i) =>
                  p.type === "text" ? <span key={i}>{p.text}</span> : null,
                )}
              </div>
              {m.role === "assistant" && (
                <>
                  {meta.deflected && (
                    <p className="mt-2 text-[11px] text-[var(--color-gold-600)]">
                      Deflected — this was a migration question. Book a MARA-registered agent:{" "}
                      <a href="/consult" className="underline">/consult</a>
                    </p>
                  )}
                  {meta.rateLimited && (
                    <p className="mt-2 text-[11px] text-[var(--color-gold-600)]">
                      Daily AI cap reached. Book a free consult:{" "}
                      <a href="/consult" className="underline">/consult</a>
                    </p>
                  )}
                  {meta.noHits && !meta.deflected && !meta.rateLimited && (
                    <p className="mt-2 text-[11px] text-[var(--color-navy-500)]">
                      Outside Atlas's current dataset. A UniMate counsellor can help:{" "}
                      <a href="/consult" className="underline">/consult</a>
                    </p>
                  )}
                  {meta.retrievedCourses && meta.retrievedCourses.length > 0 && (
                    <SourcesPill courses={meta.retrievedCourses} />
                  )}
                </>
              )}
            </div>
          );
        })}

        {status === "submitted" && (
          <p className="text-xs italic text-[var(--color-navy-500)]">
            UniMate AI is thinking…
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className={`border-t border-[var(--color-navy-100)] p-4 md:p-6 flex gap-3 ${padX}`}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about courses, IELTS, fees…"
          className="flex-1 bg-transparent border border-[var(--color-navy-100)] focus:border-[var(--color-gold-500)] outline-none px-4 py-3 text-sm"
        />
        {status === "streaming" ? (
          <button
            type="button"
            onClick={() => stop()}
            className="bg-[var(--color-gold-500)] hover:bg-[var(--color-gold-600)] text-[var(--color-navy-950)] px-5 py-3 font-display"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || status === "submitted"}
            className="bg-[var(--color-navy-950)] hover:bg-[var(--color-navy-900)] disabled:opacity-50 text-[var(--color-cream)] px-5 py-3 font-display"
          >
            Send →
          </button>
        )}
      </form>
    </div>
  );
}

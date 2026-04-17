"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";

const SUGGESTED = [
  "What IELTS score do I need for UNSW?",
  "Which Australian universities have the strongest IT programs?",
  "How much does a Master of IT cost?",
  "How do I compare Group of Eight vs regional universities?",
];

export function ChatDrawer() {
  const [open, setOpen] = useState(false);
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");

  function submit(text: string) {
    if (!text.trim()) return;
    sendMessage({ text });
    setInput("");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open AI Advisor"
        className="fixed bottom-6 right-6 z-40 bg-[var(--color-navy-950)] hover:bg-[var(--color-navy-900)] text-[var(--color-cream)] px-5 py-3 font-display text-base shadow-[0_15px_45px_-15px_rgba(13,26,61,0.55)] flex items-center gap-3 transition-colors duration-500"
        style={{ transitionTimingFunction: "var(--ease-editorial)" }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: "var(--color-gold-400)" }}
        />
        Ask the AI Advisor
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="fixed inset-0 bg-[var(--color-navy-950)]/60 backdrop-blur-sm z-50"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full md:w-[540px] bg-[var(--color-cream)] paper-grain flex flex-col"
            >
              <div className="rail-gold" />
              <header className="flex items-center justify-between px-6 md:px-8 py-6 border-b border-[var(--color-navy-100)]">
                <div>
                  <p className="eyebrow">UniMate AI</p>
                  <h2 className="font-display text-3xl text-[var(--color-navy-950)] mt-1">
                    Ask the Advisor
                  </h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="text-[var(--color-navy-700)] hover:text-[var(--color-navy-950)] text-2xl"
                >
                  ×
                </button>
              </header>

              <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-5">
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
                      Not legal or migration advice. For binding advice, book a free
                      consultation.
                    </p>
                  </div>
                )}

                {messages.map((m) => (
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
                  </div>
                ))}

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
                className="border-t border-[var(--color-navy-100)] p-4 md:p-6 flex gap-3"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about courses, IELTS, fees…"
                  className="flex-1 bg-transparent border border-[var(--color-navy-100)] focus:border-[var(--color-gold-500)] outline-none px-4 py-3 text-sm"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || status === "submitted" || status === "streaming"}
                  className="bg-[var(--color-navy-950)] hover:bg-[var(--color-navy-900)] disabled:opacity-50 text-[var(--color-cream)] px-5 py-3 font-display"
                >
                  Send →
                </button>
              </form>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

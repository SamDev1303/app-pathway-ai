"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatClient } from "./chat/ChatClient";

export function ChatDrawer() {
  const [open, setOpen] = useState(false);

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

              <ChatClient mode="drawer" />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

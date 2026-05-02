import type { Metadata } from "next";
import { Suspense } from "react";
import { ChatClient } from "@/components/chat/ChatClient";

export const metadata: Metadata = {
 title: "AI Advisor — Pathway-AI",
 description:
 "Ask Pathway-AI about CRICOS-registered Australian university courses, IELTS, fees, and intakes. Educational information only — not migration advice.",
};

export default function ChatPage() {
 return (
 <main className="min-h-[calc(100vh-4rem)] bg-[var(--color-cream)] paper-grain flex flex-col">
 <div className="rail-gold" />
 <header className="px-6 md:px-12 py-8 border-b border-[var(--color-navy-100)]">
 <p className="eyebrow">Pathway-AI AI</p>
 <h1 className="font-display text-4xl md:text-5xl text-[var(--color-navy-950)] mt-2">
 Ask the Advisor
 </h1>
 <p className="text-sm text-[var(--color-navy-700)] mt-2 max-w-2xl">
 Grounded in CRICOS-registered Australian university courses. Ask about
 fees, IELTS, intakes, and program fit. Not migration advice.
 </p>
 </header>
 <Suspense fallback={<div className="px-6 md:px-12 py-6 text-sm text-[var(--color-navy-500)]">Loading advisor…</div>}>
 <ChatClient mode="page" />
 </Suspense>
 </main>
 );
}

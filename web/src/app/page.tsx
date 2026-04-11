import { Suspense } from "react";
import { Hero } from "@/components/Hero";
import { TrustStrip } from "@/components/TrustStrip";
import { MatcherSection } from "@/components/MatcherSection";
import { Footer } from "@/components/Footer";
import { ChatDrawer } from "@/components/ChatDrawer";

export default function HomePage() {
  return (
    <main className="flex-1">
      <Hero />
      <TrustStrip />
      <MatcherSection />
      <Footer />
      <Suspense fallback={null}>
        <ChatDrawer />
      </Suspense>
    </main>
  );
}

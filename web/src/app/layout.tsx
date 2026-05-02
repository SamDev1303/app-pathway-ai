import type { Metadata } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";

const instrumentSerif = Instrument_Serif({
 variable: "--font-display",
 subsets: ["latin"],
 weight: "400",
 display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
 variable: "--font-body",
 subsets: ["latin"],
 weight: ["300", "400", "500", "600", "700"],
 display: "swap",
});

export const metadata: Metadata = {
 title: "Pathway-AI — Your gateway to Australian education",
 description:
 "registered, QEAC-certified guidance for Australian university admissions. Match to CRICOS-registered courses in under 30 seconds — no signup, no forms, no gate.",
 metadataBase: new URL("https://pathway-ai.vercel.app"),
 openGraph: {
 title: "Pathway-AI",
 description:
 "Find your Australian university. No forms. No waiting. No gate.",
 type: "website",
 locale: "en_AU",
 },
};

export default function RootLayout({
 children,
}: Readonly<{ children: React.ReactNode }>) {
 return (
 <html
 lang="en"
 className={`${instrumentSerif.variable} ${plusJakarta.variable} h-full antialiased`}
 >
 <body className="min-h-full flex flex-col">
 <div className="flex-1">{children}</div>
 <Footer />
 </body>
 </html>
 );
}

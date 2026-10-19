import type { Metadata } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "./sat.css";

const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-sat-display",
});

const body = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sat-body",
});

export const metadata: Metadata = {
  title: "SAT Practice | MetaMinds STEM Academy",
  description: "Practice SAT questions by section, domain, skill, and difficulty.",
};

export default function SatPracticeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${body.variable} sat-body sat-practice min-h-screen bg-[#0B1426] text-[#F4EFE4] antialiased`}>
      <header className="border-b border-[#C9A86A]/30">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <Link
              href="/"
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A86A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A86A]"
            >
              MetaMinds
            </Link>
            <h1 className="sat-display text-2xl leading-tight text-[#F4EFE4] sm:text-3xl">SAT Practice</h1>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}

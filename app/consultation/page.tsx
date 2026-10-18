"use client";

import { motion } from "framer-motion";
import { ArrowDown, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { siteData } from "@/lib/data";

// ─── Conversion tracking ─────────────────────────────────────────────────────
const GOOGLE_ADS_CONVERSION_ID    = "AW-XXXXXXXXX";
const GOOGLE_ADS_CONVERSION_LABEL = "XXXXXXXXXXXXXXXXXXXX";

// Exact CMO copy — do not invent. Structure left easy to fold a later draft.
const copy = {
    eyebrow: "Free. 30 minutes. No obligation.",
    h1: "Let’s find the right tutor.",
    sub: "A plan for your kid. Session notes after every session. DFW. Zoom.",
    primaryCta: "Book free consultation",
    ctaWhisper: "Evening and weekend times available.",

    whatThisCallIs: {
        h2: "What this call is",
        sub: "Not a sales script.",
        lines: [
            "Talk through goals and fit.",
            "See whether Premium Mentoring or College Mentor is right.",
            "Same system either way — one mentor who stays.",
            "Leave with a clear next step.",
        ],
    },

    onTheCall: {
        h2: "On the call.",
        bullets: [
            "SAT or ACT — which fits, where to focus",
            "AP and coursework — what’s stuck",
            "Math, coding, robotics — if that’s the need",
            "Schedule that works around school",
            "Which tier makes sense — and why",
        ],
    },

    twoWaysIn: {
        h2: "Two ways in.",
        cards: [
            {
                name: "Premium Mentoring",
                rate: "From $70/hr",
                description: "Practicing engineers and specialists. SAT, ACT, AP, advanced work.",
            },
            {
                name: "College Mentor",
                rate: "From $50/hr",
                description: "Same system. Near-peer mentor. More accessible price — not a lesser track.",
            },
        ],
        whisper: "Younger or foundational support — ask on the consult.",
    },

    bringWhatYouHave: {
        h2: "Bring what you have.",
        items: [
            "Recent scores — if you have them",
            "Current class and what’s hard",
            "Test date — if it’s set",
            "Target schools — optional",
        ],
        whisper: "Missing all of that is fine. Book anyway.",
    },

    oneMentor: {
        h2: "One mentor. A plan you can see.",
        lines: [
            "Not a marketplace. Not a rotation.",
            "Session notes after every session.",
            "Homework with real feedback.",
            "Updates from the person who taught.",
        ],
    },

    faq: {
        h2: "Quick answers.",
        items: [
            { q: "How long is the consultation?", a: "Thirty minutes." },
            { q: "Is it really free?", a: "Yes. No obligation." },
            { q: "Who will I talk to?", a: "Jose or a MetaMinds mentor who can speak to fit and plan." },
            { q: "We’re not doing SAT/ACT — still worth it?", a: "Yes. AP, math, coding, and STEM mentoring too." },
            { q: "Can my student join?", a: "Yes, if you want them on the call." },
            { q: "What happens after?", a: "If it’s a fit, we match a tutor and schedule. If not, you still leave with a clearer plan." },
        ],
    },

    close: {
        h2: "Ready when you are.",
        cta: "Book free consultation",
        whisperPrefix: "Questions?",
        email: "metamindsstemacademy@gmail.com",
    },
} as const;

interface CalendlyWindow extends Window {
    Calendly?: { initInlineWidget: (opts: { url: string; parentElement: HTMLElement }) => void };
    gtag?: (...args: unknown[]) => void;
    dataLayer?: Record<string, unknown>[];
}

function FAQItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            >
                <span className="font-semibold text-gray-900 text-sm pr-4">{q}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
                    {a}
                </div>
            )}
        </div>
    );
}

const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, delay },
});

function initCalendlyWidget(url: string) {
    const w = window as CalendlyWindow;
    const el = document.getElementById("calendly-embed");
    if (el && w.Calendly) {
        el.innerHTML = "";
        w.Calendly.initInlineWidget({ url, parentElement: el });
    }
}

export default function ConsultationPage() {
    const calendlyUrl = siteData.hero?.formUrl ?? "";
    const router = useRouter();

    useEffect(() => {
        if ((window as CalendlyWindow).Calendly) {
            initCalendlyWidget(calendlyUrl);
        }
    }, [calendlyUrl]);

    useEffect(() => {
        function handleMessage(e: MessageEvent) {
            if ((e.data as { event?: string } | null)?.event !== "calendly.event_scheduled") return;

            const w = window as CalendlyWindow;
            w.gtag?.("event", "conversion", {
                send_to: `${GOOGLE_ADS_CONVERSION_ID}/${GOOGLE_ADS_CONVERSION_LABEL}`,
            });
            w.gtag?.("event", "generate_lead", {
                event_category: "consultation",
                event_label: "calendly_booking",
                value: 1,
            });
            w.dataLayer = w.dataLayer ?? [];
            w.dataLayer.push({ event: "calendly_scheduled" });

            router.push("/success");
        }
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [router]);

    return (
        <>
            <Navbar />

            <Script
                src="https://assets.calendly.com/assets/external/widget.js"
                strategy="afterInteractive"
                onLoad={() => initCalendlyWidget(siteData.hero?.formUrl ?? "")}
            />

            <main className="bg-white">

                {/* ── First fold: eyebrow + H1 + sub + CTA only ── */}
                <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 min-h-[85vh] flex items-center pt-28 pb-24 px-6 text-center overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]" />
                    <div className="relative max-w-4xl mx-auto w-full">
                        <motion.div {...fade()}>
                            <span className="inline-block text-blue-300 text-xs font-bold uppercase tracking-widest mb-8">
                                {copy.eyebrow}
                            </span>
                        </motion.div>
                        <motion.h1
                            {...fade(0.1)}
                            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-[1.1] tracking-tight"
                        >
                            {copy.h1}
                        </motion.h1>
                        <motion.p {...fade(0.2)} className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-12 leading-relaxed">
                            {copy.sub}
                        </motion.p>
                        <motion.div {...fade(0.3)} className="flex flex-col items-center gap-4">
                            <a
                                href="#schedule"
                                className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-10 py-4 rounded-xl hover:bg-blue-700 transition-colors text-lg"
                            >
                                {copy.primaryCta}
                                <ArrowDown className="w-5 h-5" />
                            </a>
                            <p className="text-blue-300 text-sm">{copy.ctaWhisper}</p>
                        </motion.div>
                    </div>
                </section>

                {/* ── What this call is ── */}
                <section className="py-20 px-6">
                    <div className="max-w-3xl mx-auto">
                        <motion.div {...fade()} className="text-center mb-10">
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">{copy.whatThisCallIs.h2}</h2>
                            <p className="text-gray-500 text-lg">{copy.whatThisCallIs.sub}</p>
                        </motion.div>
                        <div className="space-y-3">
                            {copy.whatThisCallIs.lines.map((line, i) => (
                                <motion.p
                                    key={line}
                                    {...fade(i * 0.05)}
                                    className="text-center text-gray-700 text-base md:text-lg leading-relaxed"
                                >
                                    {line}
                                </motion.p>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── On the call ── */}
                <section className="py-20 px-6 bg-gray-50">
                    <div className="max-w-3xl mx-auto">
                        <motion.h2 {...fade()} className="text-3xl md:text-4xl font-black text-gray-900 mb-10 text-center">
                            {copy.onTheCall.h2}
                        </motion.h2>
                        <ul className="space-y-4">
                            {copy.onTheCall.bullets.map((item, i) => (
                                <motion.li
                                    key={item}
                                    {...fade(i * 0.05)}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 text-gray-700 text-sm md:text-base leading-relaxed"
                                >
                                    {item}
                                </motion.li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* ── Two ways in — two cards only ── */}
                <section className="py-20 px-6">
                    <div className="max-w-4xl mx-auto">
                        <motion.h2 {...fade()} className="text-3xl md:text-4xl font-black text-gray-900 mb-10 text-center">
                            {copy.twoWaysIn.h2}
                        </motion.h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {copy.twoWaysIn.cards.map((card, i) => (
                                <motion.div
                                    key={card.name}
                                    {...fade(i * 0.08)}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col"
                                >
                                    <h3 className="text-lg font-black text-gray-900 mb-2">{card.name}</h3>
                                    <p className="text-2xl font-black text-gray-900 mb-4">{card.rate}</p>
                                    <p className="text-sm text-gray-600 leading-relaxed">{card.description}</p>
                                </motion.div>
                            ))}
                        </div>
                        <motion.p {...fade(0.2)} className="text-center text-xs text-gray-400 mt-6">
                            {copy.twoWaysIn.whisper}
                        </motion.p>
                    </div>
                </section>

                {/* ── Bring what you have ── */}
                <section className="py-20 px-6 bg-slate-900">
                    <div className="max-w-3xl mx-auto">
                        <motion.h2 {...fade()} className="text-3xl md:text-4xl font-black text-white mb-10 text-center">
                            {copy.bringWhatYouHave.h2}
                        </motion.h2>
                        <ul className="space-y-3">
                            {copy.bringWhatYouHave.items.map((item, i) => (
                                <motion.li
                                    key={item}
                                    {...fade(i * 0.05)}
                                    className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-sm"
                                >
                                    {item}
                                </motion.li>
                            ))}
                        </ul>
                        <motion.p {...fade(0.3)} className="text-center text-blue-300 text-sm mt-8">
                            {copy.bringWhatYouHave.whisper}
                        </motion.p>
                    </div>
                </section>

                {/* ── One mentor ── */}
                <section className="py-20 px-6">
                    <div className="max-w-3xl mx-auto">
                        <motion.h2 {...fade()} className="text-3xl md:text-4xl font-black text-gray-900 mb-10 text-center">
                            {copy.oneMentor.h2}
                        </motion.h2>
                        <div className="space-y-3">
                            {copy.oneMentor.lines.map((line, i) => (
                                <motion.p
                                    key={line}
                                    {...fade(i * 0.05)}
                                    className="text-center text-gray-700 text-base md:text-lg leading-relaxed"
                                >
                                    {line}
                                </motion.p>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── FAQ ── */}
                <section className="py-20 px-6 bg-gray-50">
                    <div className="max-w-3xl mx-auto">
                        <motion.h2 {...fade()} className="text-3xl md:text-4xl font-black text-gray-900 mb-10 text-center">
                            {copy.faq.h2}
                        </motion.h2>
                        <div className="space-y-3">
                            {copy.faq.items.map((faq, i) => (
                                <motion.div key={faq.q} {...fade(i * 0.05)}>
                                    <FAQItem q={faq.q} a={faq.a} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Close + existing Calendly embed ── */}
                <section id="schedule" className="py-20 px-6 bg-white">
                    <div className="max-w-3xl mx-auto">
                        <motion.div {...fade()} className="text-center mb-10">
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-8">{copy.close.h2}</h2>
                            <a
                                href="#calendly-embed"
                                className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-10 py-4 rounded-xl hover:bg-blue-700 transition-colors text-lg"
                            >
                                {copy.close.cta}
                                <ArrowDown className="w-5 h-5" />
                            </a>
                            <p className="text-gray-400 text-sm mt-5">
                                {copy.close.whisperPrefix}{" "}
                                <a href={`mailto:${copy.close.email}`} className="text-blue-600 hover:underline">
                                    {copy.close.email}
                                </a>
                            </p>
                        </motion.div>
                        <motion.div {...fade(0.1)}>
                            <div
                                id="calendly-embed"
                                className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white"
                                style={{ minWidth: "320px", height: "700px" }}
                            />
                        </motion.div>
                    </div>
                </section>

            </main>

            <Footer />
        </>
    );
}

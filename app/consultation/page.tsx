"use client";

import { motion } from "framer-motion";
import {
    CheckCircle2, Clock, Video,
    ArrowDown, Shield, Users, TrendingUp, Lightbulb,
    BookOpen, Target, Brain, ChevronDown, Code, Layers,
} from "lucide-react";
import { useState, useEffect } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { siteData } from "@/lib/data";

// ─── Conversion tracking ─────────────────────────────────────────────────────
// Replace these with your values from Google Ads → Goals → Conversions → Tag setup
const GOOGLE_ADS_CONVERSION_ID    = "AW-XXXXXXXXX";
const GOOGLE_ADS_CONVERSION_LABEL = "XXXXXXXXXXXXXXXXXXXX";

// ─── Page data ────────────────────────────────────────────────────────────────

const benefits = [
    {
        icon: Shield,
        title: "100% Free — No Commitment",
        description: "A genuine conversation, not a sales pitch. You'll get real advice whether or not you book sessions.",
    },
    {
        icon: Target,
        title: "Pinpoint Exactly Where to Focus",
        description: "We identify the specific gaps — in test prep, coursework, or a new skill — holding your student back.",
    },
    {
        icon: Video,
        title: "Meet Your Tutor Before You Pay",
        description: "See how we teach and ask anything. Most families schedule their first session on the call — on their terms.",
    },
    {
        icon: BookOpen,
        title: "Get a Subject-Specific Game Plan",
        description: "Whether it's the SAT, AP Calculus, Python, or catching up in math class — we'll map out the right path.",
    },
    {
        icon: Clock,
        title: "Leave With an Actionable Plan",
        description: "A concrete week-by-week study schedule tailored to your student's goals, pace, and timeline.",
    },
    {
        icon: Brain,
        title: "Expert Perspective, Not a Script",
        description: "Our tutors are working engineers and scientists — they spot root causes other tutors miss.",
    },
];

const whatParentsLearn = [
    "Exactly what's holding your student back and where to focus first",
    "Whether test prep, coursework support, or skill-building is the right starting point",
    "How the Digital SAT's adaptive format works and how to use Desmos strategically",
    "Whether the SAT or ACT is a better fit for your student's strengths",
    "What a realistic improvement timeline looks like for your student's specific goal",
    "How AP exam scoring works and how our approach is different from school prep",
    "What a strong weekly study schedule looks like around school and activities",
    "How our tutors approach coding, 3D printing, and STEM mentoring for beginners",
];

const prepChecklist = [
    { item: "Most recent SAT, ACT, PSAT, or AP score report (if applicable)", required: true },
    { item: "Current math class and any classes the student is struggling with", required: true },
    { item: "Upcoming test date, if already scheduled", required: false },
    { item: "List of target colleges or programs", required: false },
    { item: "Current GPA", required: false },
    { item: "A notebook and pen for taking notes", required: false },
];

const services = [
    { icon: Target,  label: "SAT & ACT Prep" },
    { icon: Layers,  label: "AP Exam Prep" },
    { icon: BookOpen,label: "GED Prep" },
    { icon: Brain,   label: "K–12 Math & Science" },
    { icon: Code,    label: "Coding & Programming" },
    { icon: Lightbulb, label: "3D Printing & STEM" },
];

const whyMetaMinds = [
    {
        icon: Users,
        stat: "500+",
        label: "Students Helped",
        description: "Families across the DFW Metroplex trust MetaMinds for test prep, academics, and STEM mentoring.",
    },
    {
        icon: TrendingUp,
        stat: "+200pts",
        label: "Avg SAT Improvement",
        description: "Our structured, personalized approach consistently delivers score improvements that matter.",
    },
    {
        icon: Lightbulb,
        stat: "B.S. / M.S.",
        label: "Tutor Credentials",
        description: "Every tutor holds an engineering or CS degree from a top university and works in their field today.",
    },
    {
        icon: CheckCircle2,
        stat: "98%",
        label: "Satisfaction Rate",
        description: "We back every engagement with a money-back guarantee. Your student's progress is our measure of success.",
    },
];

const faqs = [
    {
        q: "How long is the consultation?",
        a: "30 minutes via Zoom. We keep it focused — no fluff. If you have more questions, we're happy to go a few minutes over.",
    },
    {
        q: "Is it really free?",
        a: "Yes — completely free, no credit card required, no obligation to continue. We do this because families who understand how we work become long-term clients.",
    },
    {
        q: "Who will I be speaking with?",
        a: "You'll speak directly with Jose, the founder of MetaMinds — a UCSD Computer Science graduate with 7+ years of tutoring experience in test prep, coding, and STEM.",
    },
    {
        q: "We're not focused on SAT/ACT — can we still book?",
        a: "Absolutely. The consultation works for any goal: improving grades in a specific class, learning to code, AP exam prep, GED prep, or exploring 3D printing and robotics. We'll talk through whatever your student needs.",
    },
    {
        q: "Can my student join the call?",
        a: "Yes, and we encourage it. Speaking with the student directly helps us build a more accurate and effective plan.",
    },
    {
        q: "What happens after the consultation?",
        a: "If you'd like to move forward, we'll send you package options and get your first session scheduled — usually within the week. No pressure, no deadline.",
    },
    {
        q: "We don't have any score reports. Should we still book?",
        a: "Yes. A score report is helpful but not required. A quick conversation about current classes, goals, and challenges gives us everything we need.",
    },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

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

// ─── Page ────────────────────────────────────────────────────────────────────

function initCalendlyWidget(url: string) {
    const w = window as any;
    const el = document.getElementById("calendly-embed");
    if (el && w.Calendly) {
        el.innerHTML = "";
        w.Calendly.initInlineWidget({ url, parentElement: el });
    }
}

export default function ConsultationPage() {
    const calendlyUrl = siteData.hero?.formUrl ?? "";
    const router = useRouter();

    // Init widget if Calendly script was already cached (client-side navigation)
    useEffect(() => {
        if ((window as any).Calendly) {
            initCalendlyWidget(calendlyUrl);
        }
    }, [calendlyUrl]);

    // Conversion tracking + redirect to /success after booking
    useEffect(() => {
        function handleMessage(e: MessageEvent) {
            if (e.data?.event !== "calendly.event_scheduled") return;

            const w = window as any;
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

                {/* ── Hero ── */}
                <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pt-32 pb-24 px-6 text-center overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]" />
                    <div className="relative max-w-4xl mx-auto">
                        <motion.div {...fade()}>
                            <span className="inline-block bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6 border border-blue-500/30">
                                Free · 30 Minutes · No Obligation
                            </span>
                        </motion.div>
                        <motion.h1 {...fade(0.1)} className="text-5xl md:text-7xl font-black text-white mb-6 leading-[1.05]">
                            Let's Build Your<br className="hidden md:block" /> Student's<br className="hidden md:block" /> Success Plan
                        </motion.h1>
                        <motion.p {...fade(0.2)} className="text-xl text-blue-100 max-w-2xl mx-auto mb-6 leading-relaxed">
                            Whether it's the SAT, AP exams, struggling in math, learning to code, or exploring 3D printing — talk directly with a working engineer and walk away with a real plan.
                        </motion.p>

                        {/* Service tags */}
                        <motion.div {...fade(0.25)} className="flex flex-wrap justify-center gap-2 mb-10">
                            {services.map(({ icon: Icon, label }) => (
                                <span key={label} className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-blue-100 text-xs font-medium px-3 py-1.5 rounded-full">
                                    <Icon className="w-3.5 h-3.5" />
                                    {label}
                                </span>
                            ))}
                        </motion.div>

                        <motion.div {...fade(0.3)} className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                            <a
                                href="#schedule"
                                className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-10 py-4 rounded-xl hover:bg-blue-700 transition-colors text-lg"
                            >
                                Book My Free Consultation
                                <ArrowDown className="w-5 h-5" />
                            </a>
                            <span className="text-blue-300 text-sm">Evening & weekend slots available</span>
                        </motion.div>

                        {/* Trust stats */}
                        <motion.div {...fade(0.4)} className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                            {siteData.trustBar.map((t) => (
                                <div key={t.label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                                    <div className="text-2xl font-black text-white">{t.value}</div>
                                    <div className="text-blue-300 text-xs mt-0.5">{t.label}</div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ── Benefits ── */}
                <section className="py-20 px-6 bg-gray-50">
                    <div className="max-w-5xl mx-auto">
                        <motion.div {...fade()} className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">Why This 30-Minute Call Is Worth It</h2>
                            <p className="text-gray-500 max-w-xl mx-auto">Most parents leave the call saying they wish they'd done it sooner.</p>
                        </motion.div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {benefits.map(({ icon: Icon, title, description }, i) => (
                                <motion.div key={title} {...fade(i * 0.05)} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                                        <Icon className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── What Parents Will Learn ── */}
                <section className="py-20 px-6">
                    <div className="max-w-4xl mx-auto">
                        <motion.div {...fade()} className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">What You'll Learn on the Call</h2>
                            <p className="text-gray-500 max-w-xl mx-auto">Clear, specific answers — not generic advice.</p>
                        </motion.div>
                        <div className="grid md:grid-cols-2 gap-3">
                            {whatParentsLearn.map((item, i) => (
                                <motion.div key={item} {...fade(i * 0.04)} className="flex items-start gap-3 bg-blue-50 rounded-xl px-5 py-4">
                                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700 text-sm leading-snug">{item}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── What to Prepare ── */}
                <section className="py-20 px-6 bg-slate-900">
                    <div className="max-w-3xl mx-auto">
                        <motion.div {...fade()} className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">What to Have Ready</h2>
                            <p className="text-blue-200 max-w-xl mx-auto">These help us give the most specific advice. Missing items won't stop us.</p>
                        </motion.div>
                        <div className="space-y-3">
                            {prepChecklist.map(({ item, required }, i) => (
                                <motion.div key={item} {...fade(i * 0.05)} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-5 py-4">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${required ? "bg-blue-600" : "bg-white/10"}`}>
                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-white text-sm flex-1">{item}</span>
                                    {required ? (
                                        <span className="text-blue-300 text-xs font-medium bg-blue-500/20 px-2 py-0.5 rounded-full">Helpful</span>
                                    ) : (
                                        <span className="text-gray-500 text-xs">Optional</span>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                        <motion.p {...fade(0.3)} className="text-center text-blue-300 text-sm mt-8 italic">
                            Don't have these? That's completely okay — book the call anyway.
                        </motion.p>
                    </div>
                </section>

                {/* ── Why MetaMinds ── */}
                <section className="py-20 px-6 bg-white">
                    <div className="max-w-5xl mx-auto">
                        <motion.div {...fade()} className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">Why Families Choose MetaMinds</h2>
                            <p className="text-gray-500 max-w-xl mx-auto">We're not a tutoring marketplace or a franchise. Every session is with a working professional who has mastered the material firsthand.</p>
                        </motion.div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {whyMetaMinds.map(({ icon: Icon, stat, label, description }, i) => (
                                <motion.div key={label} {...fade(i * 0.07)} className="text-center p-6 rounded-2xl border border-gray-100 shadow-sm">
                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                                        <Icon className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="text-3xl font-black text-blue-600 mb-1">{stat}</div>
                                    <div className="font-bold text-gray-900 text-sm mb-2">{label}</div>
                                    <p className="text-gray-500 text-xs leading-relaxed">{description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Testimonials ── */}
                {siteData.testimonials?.length > 0 && (
                    <section className="py-20 px-6 bg-blue-50">
                        <div className="max-w-5xl mx-auto">
                            <motion.div {...fade()} className="text-center mb-12">
                                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">Real Results From Real Families</h2>
                                <p className="text-gray-500">These students booked the same free consultation you're looking at right now.</p>
                            </motion.div>
                            <div className="grid md:grid-cols-3 gap-6">
                                {siteData.testimonials.map((t, i) => (
                                    <motion.div key={t.author} {...fade(i * 0.08)} className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
                                        <div className="flex gap-0.5 mb-4">
                                            {[...Array(5)].map((_, j) => (
                                                <svg key={j} className="w-4 h-4 fill-amber-400 text-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                            ))}
                                        </div>
                                        <p className="text-gray-700 text-sm leading-relaxed mb-5">"{t.quote}"</p>
                                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                {t.author[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{t.author}</p>
                                                <p className="text-gray-400 text-xs">{t.role}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── FAQ ── */}
                <section className="py-20 px-6 bg-white">
                    <div className="max-w-3xl mx-auto">
                        <motion.div {...fade()} className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">Common Questions</h2>
                            <p className="text-gray-500">Everything you need to know before booking.</p>
                        </motion.div>
                        <div className="space-y-3">
                            {faqs.map((faq, i) => (
                                <motion.div key={faq.q} {...fade(i * 0.05)}>
                                    <FAQItem q={faq.q} a={faq.a} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Embedded Calendly ── */}
                <section id="schedule" className="py-20 px-6 bg-gray-50">
                    <div className="max-w-3xl mx-auto">
                        <motion.div {...fade()} className="text-center mb-10">
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">Pick a Time That Works for You</h2>
                            <p className="text-gray-500">Evening and weekend slots available. Takes 2 minutes to book.</p>
                        </motion.div>
                        <motion.div {...fade(0.1)}>
                            <div
                                id="calendly-embed"
                                className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white"
                                style={{ minWidth: "320px", height: "700px" }}
                            />
                        </motion.div>
                        <p className="text-center text-gray-400 text-xs mt-6">
                            Questions? Email us at{" "}
                            <a href={`mailto:${siteData.brand.email}`} className="text-blue-600 hover:underline">
                                {siteData.brand.email}
                            </a>
                        </p>
                    </div>
                </section>

            </main>

            <Footer />
        </>
    );
}

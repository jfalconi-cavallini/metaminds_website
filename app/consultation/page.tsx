"use client";

import { motion } from "framer-motion";
import {
    CheckCircle2, Clock, Video, ClipboardList, Star,
    ArrowDown, Shield, Users, TrendingUp, Lightbulb,
    BookOpen, Target, Brain, Calculator, ChevronDown,
} from "lucide-react";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { siteData } from "@/lib/data";

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
        description: "We identify the specific question types and topics costing your student the most points.",
    },
    {
        icon: Video,
        title: "Meet Your Tutor Before You Pay",
        description: "See how we teach and ask anything. Most families schedule their first session on the call — on their terms.",
    },
    {
        icon: BookOpen,
        title: "Understand the Digital SAT",
        description: "Most families don't know how adaptive scoring works or how to use Desmos strategically. We explain it all.",
    },
    {
        icon: Clock,
        title: "Leave With an Actionable Plan",
        description: "A concrete week-by-week study timeline tied to your student's test date and target score.",
    },
    {
        icon: Brain,
        title: "Expert Perspective, Not a Script",
        description: "Our tutors are working engineers and scientists — they spot patterns and root causes other tutors miss.",
    },
];

const whatParentsLearn = [
    "Exactly which question types are costing the most points and why",
    "How the Digital SAT's adaptive format affects strategy",
    "How to use Desmos and the on-screen calculator to gain points",
    "Whether SAT or ACT is a better fit for your student",
    "A realistic target score and timeline based on test date",
    "The most effective study method for your student's learning style",
    "What a strong weekly study schedule looks like",
    "How our tutors approach score improvement differently",
];

const prepChecklist = [
    { item: "Most recent SAT, ACT, or PSAT score report", required: true },
    { item: "Current math class (Algebra 2, Pre-Calc, Calculus, etc.)", required: true },
    { item: "Upcoming test date, if already scheduled", required: false },
    { item: "List of target colleges or programs", required: false },
    { item: "Current GPA", required: false },
    { item: "A notebook and pen for taking notes", required: false },
];

const whyMetaMinds = [
    {
        icon: Users,
        stat: "500+",
        label: "Students Helped",
        description: "Families across the DFW Metroplex trust MetaMinds for SAT, ACT, GED, and STEM tutoring.",
    },
    {
        icon: TrendingUp,
        stat: "+200pts",
        label: "Average SAT Improvement",
        description: "Our structured, personalized approach consistently delivers score improvements that move the needle.",
    },
    {
        icon: Lightbulb,
        stat: "B.S. / M.S.",
        label: "Tutor Credentials",
        description: "Every tutor holds an engineering or CS degree from a top university — and works in their field today.",
    },
    {
        icon: CheckCircle2,
        stat: "98%",
        label: "Satisfaction Rate",
        description: "We back every engagement with a money-back guarantee. Your student's progress is our only measure of success.",
    },
];

const faqs = [
    {
        q: "How long is the consultation?",
        a: "30 minutes via Zoom. We keep it focused and won't waste your time. If you have more questions, we're happy to go a few minutes over.",
    },
    {
        q: "Is it really free?",
        a: "Yes — completely free, no credit card required, no obligation to continue. We do this because the best clients come from families who've seen how we work.",
    },
    {
        q: "Who will I be speaking with?",
        a: "You'll speak directly with Jose, the founder of MetaMinds — a UCSD Computer Science graduate with 7+ years of tutoring experience.",
    },
    {
        q: "Can my student join the call?",
        a: "Absolutely, and we encourage it. We can speak with the student directly, see how they think about problems, and build a stronger plan as a result.",
    },
    {
        q: "What happens after the consultation?",
        a: "If you'd like to move forward, we'll send you package options and get your first session scheduled — usually within the week. There's no pressure and no deadline.",
    },
    {
        q: "We don't have score reports yet. Should we still book?",
        a: "Yes. A score report is helpful but not required. We can assess your student's situation from a quick conversation about their current classes and goals.",
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

export default function ConsultationPage() {
    const calendlyUrl = siteData.hero?.formUrl ?? "";

    return (
        <>
            <Navbar />

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
                            Your Child's Score<br className="hidden md:block" /> Breakthrough<br className="hidden md:block" /> Starts Here
                        </motion.h1>
                        <motion.p {...fade(0.2)} className="text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
                            Talk directly with a working engineer. We'll review your student's current scores, find the gaps, and hand you a personalized plan — in 30 minutes flat.
                        </motion.p>
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
                            <p className="text-gray-500 max-w-xl mx-auto">By the end of the 30 minutes, you'll have clear, specific answers to these questions.</p>
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
                            <p className="text-blue-200 max-w-xl mx-auto">These help us give you the most specific advice possible. But don't let missing items stop you from booking.</p>
                        </motion.div>
                        <div className="space-y-3">
                            {prepChecklist.map(({ item, required }, i) => (
                                <motion.div key={item} {...fade(i * 0.05)} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-5 py-4">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${required ? "bg-blue-600" : "bg-white/10"}`}>
                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-white text-sm">{item}</span>
                                    </div>
                                    {required ? (
                                        <span className="text-blue-300 text-xs font-medium bg-blue-500/20 px-2 py-0.5 rounded-full">Helpful</span>
                                    ) : (
                                        <span className="text-gray-500 text-xs">Optional</span>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                        <motion.p {...fade(0.3)} className="text-center text-blue-300 text-sm mt-8 italic">
                            Don't have these available? That's completely okay — book the call anyway.
                        </motion.p>
                    </div>
                </section>

                {/* ── Why MetaMinds ── */}
                <section className="py-20 px-6 bg-white">
                    <div className="max-w-5xl mx-auto">
                        <motion.div {...fade()} className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">Why Families Choose MetaMinds</h2>
                            <p className="text-gray-500 max-w-xl mx-auto">We're not a tutoring marketplace or a franchise. Every session is with a working professional who's mastered the material firsthand.</p>
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
                                                <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
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
                            <p className="text-gray-500">Evening and weekend slots available. It takes 2 minutes to book.</p>
                        </motion.div>
                        <motion.div {...fade(0.1)}>
                            <div
                                className="calendly-inline-widget rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white"
                                data-url={calendlyUrl}
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

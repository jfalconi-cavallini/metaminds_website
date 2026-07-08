"use client";

import { CheckCircle2, Clock, Video, ClipboardList, Star, ArrowDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { siteData } from "@/lib/data";

const benefits = [
    {
        icon: CheckCircle2,
        title: "100% Free, No Commitment",
        description: "This is a genuine conversation — not a sales call. No pressure, no obligation to sign up.",
    },
    {
        icon: ClipboardList,
        title: "Personalized Assessment",
        description: "We review your student's current grades, test scores, and goals to pinpoint exactly where to focus.",
    },
    {
        icon: Video,
        title: "Meet Your Tutor First",
        description: "See how we work before you commit. Most families book sessions on the spot — but it's always your call.",
    },
    {
        icon: Clock,
        title: "Walk Away With a Plan",
        description: "By the end of the call you'll have a clear, actionable study plan — whether you continue with us or not.",
    },
];

const steps = [
    { step: "1", title: "We review your student's situation", body: "Share recent SAT/ACT scores, current math class, GPA, and target colleges. Don't have everything? That's fine." },
    { step: "2", title: "We identify the gaps", body: "Our tutors are working engineers and scientists — we quickly spot where the student is losing points and why." },
    { step: "3", title: "We explain how the Digital SAT works", body: "Most families don't know the new format. We walk you through the structure, adaptive scoring, and key tools like Desmos." },
    { step: "4", title: "We build a custom study plan", body: "You'll leave with a concrete timeline and weekly targets matched to your test date and goal score." },
];

export default function ConsultationPage() {
    const testimonials = siteData.testimonials ?? [];
    const calendlyUrl = siteData.hero?.formUrl ?? "";

    return (
        <>
            <Navbar />

            <main className="min-h-screen bg-white pt-20">

                {/* Hero */}
                <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-20 px-6 text-center">
                    <p className="text-blue-300 text-sm font-bold uppercase tracking-widest mb-4">Free · 30 Minutes · No Obligation</p>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                        Book Your Free<br className="hidden md:block" /> Consultation
                    </h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
                        Talk directly with a working engineer or scientist. We'll review your student's scores, identify the gaps, and build a personalized plan — in 30 minutes.
                    </p>
                    <a href="#schedule" className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors">
                        Schedule Below
                        <ArrowDown className="w-5 h-5" />
                    </a>
                </section>

                {/* Benefits */}
                <section className="py-20 px-6 bg-gray-50">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-3xl font-black text-gray-900 text-center mb-12">Why Book a Consultation?</h2>
                        <div className="grid sm:grid-cols-2 gap-6">
                            {benefits.map(({ icon: Icon, title, description }) => (
                                <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                        <Icon className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* What to Expect */}
                <section className="py-20 px-6">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl font-black text-gray-900 text-center mb-12">What Happens on the Call</h2>
                        <div className="space-y-6">
                            {steps.map(({ step, title, body }) => (
                                <div key={step} className="flex gap-5">
                                    <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-sm">
                                        {step}
                                    </div>
                                    <div className="pt-1">
                                        <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials */}
                {testimonials.length > 0 && (
                    <section className="py-20 px-6 bg-blue-50">
                        <div className="max-w-5xl mx-auto">
                            <h2 className="text-3xl font-black text-gray-900 text-center mb-12">What Parents & Students Say</h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                {testimonials.map((t) => (
                                    <div key={t.author} className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
                                        <div className="flex gap-0.5 mb-4">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                            ))}
                                        </div>
                                        <p className="text-gray-700 text-sm leading-relaxed mb-4">"{t.quote}"</p>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{t.author}</p>
                                            <p className="text-gray-400 text-xs">{t.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Embedded Calendly */}
                <section id="schedule" className="py-20 px-6">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl font-black text-gray-900 text-center mb-3">Pick a Time That Works</h2>
                        <p className="text-gray-500 text-center mb-10">Evening and weekend slots available.</p>
                        <div
                            className="calendly-inline-widget rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
                            data-url={calendlyUrl}
                            style={{ minWidth: "320px", height: "700px" }}
                        />
                    </div>
                </section>

            </main>

            <Footer />
        </>
    );
}

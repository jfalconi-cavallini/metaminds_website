"use client";

import Link from "next/link";
import { CheckCircle2, BookOpen, Target, Brain, Calculator, BarChart2, Map, MessageCircle, ClipboardList } from "lucide-react";
import Navbar from "@/components/Navbar";
import { siteData } from "@/lib/data";

const coverItems = [
    { icon: BarChart2,     text: "Review current grades and SAT/ACT scores" },
    { icon: Target,        text: "Discuss college goals" },
    { icon: Brain,         text: "Identify strengths and knowledge gaps" },
    { icon: BookOpen,      text: "Explain how the Digital SAT works" },
    { icon: Calculator,    text: "Demonstrate useful tools such as Desmos" },
    { icon: Map,           text: "Build a personalized study plan" },
    { icon: MessageCircle, text: "Answer any parent or student questions" },
];

const prepItems = [
    "Most recent SAT/ACT or PSAT score report",
    "Current math class",
    "Current GPA (optional)",
    "List of colleges they're interested in",
    "Notebook and pencil",
];

export default function SuccessPage() {
    return (
        <>
            <Navbar />

            <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white pt-24 pb-20 px-6">
                <div className="max-w-3xl mx-auto">

                    {/* Hero confirmation */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                            Consultation Booked!
                        </h1>
                        <p className="text-xl text-gray-600 max-w-xl mx-auto">
                            Thank you for scheduling your free consultation with MetaMinds. You made a great decision for your student.
                        </p>
                        <p className="mt-3 text-sm text-gray-500">
                            A confirmation email from Calendly will arrive in your inbox within a few minutes.
                        </p>
                    </div>

                    {/* What we'll cover */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">What We'll Cover</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {coverItems.map(({ icon: Icon, text }) => (
                                <div key={text} className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Icon className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <span className="text-sm text-gray-700 leading-snug">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Please prepare */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-10">
                        <div className="flex items-center gap-3 mb-2">
                            <ClipboardList className="w-6 h-6 text-blue-600" />
                            <h2 className="text-2xl font-bold text-gray-900">Please Prepare</h2>
                        </div>
                        <p className="text-gray-500 text-sm mb-6">
                            If possible, have these ready before the call — but don't worry if you don't have everything.
                        </p>
                        <ul className="space-y-3">
                            {prepItems.map((item) => (
                                <li key={item} className="flex items-center gap-3 text-gray-700 text-sm">
                                    <span className="w-5 h-5 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs font-bold">✓</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <p className="mt-6 text-sm text-gray-400 italic">
                            If you don't have these available, that's completely okay. We'll work with whatever you have.
                        </p>
                    </div>

                    {/* Footer actions */}
                    <div className="text-center space-y-4">
                        <Link
                            href="/"
                            className="inline-block px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                        >
                            Back to Home
                        </Link>
                        <p className="text-sm text-gray-400">
                            Questions?{" "}
                            <a href={`mailto:${siteData.brand.email}`} className="text-blue-600 hover:underline">
                                {siteData.brand.email}
                            </a>
                        </p>
                    </div>

                </div>
            </main>
        </>
    );
}

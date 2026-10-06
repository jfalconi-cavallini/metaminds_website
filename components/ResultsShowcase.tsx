"use client";

import { motion } from "framer-motion";
import { BookOpen, FlaskConical, Atom, PenLine, Calculator, Lightbulb, CheckCircle } from "lucide-react";
import Section from "./Section";

const programs = [
    {
        icon: BookOpen,
        title: "SAT Prep",
        description: "Full length practice tests, score tracking by section, and sessions built around your student's actual weak areas, not a generic syllabus.",
        details: [
            "Full length practice tests",
            "Targeted weak area focus",
            "Test day strategy",
            "College readiness guidance"
        ]
    },
    {
        icon: FlaskConical,
        title: "AP Chemistry",
        description: "AP Chemistry help built around the units your student is working on now, with free response practice and exam pacing.",
        details: [
            "Unit by unit review",
            "Free response practice",
            "Lab and data questions",
            "Exam day pacing"
        ]
    },
    {
        icon: Calculator,
        title: "Math",
        description: "Elementary through calculus, with a focus on actually understanding the concept, not memorizing steps to pass the next quiz.",
        details: [
            "Elementary to advanced levels",
            "Homework help",
            "Concept mastery focus",
            "Real world applications"
        ]
    },
    {
        icon: Atom,
        title: "Science",
        description: "Science help from elementary through high school, with clear explanations and practice that builds on what your student is learning in class.",
        details: [
            "Clear concept explanations",
            "Homework help",
            "Test review",
            "Study skills"
        ]
    },
    {
        icon: PenLine,
        title: "English & Writing",
        description: "Reading, writing, and grammar help, from building strong habits early to sharpening essays in high school.",
        details: [
            "Reading comprehension",
            "Writing and essays",
            "Grammar and vocabulary",
            "SAT Reading and Writing"
        ]
    },
    {
        icon: Lightbulb,
        title: "And More",
        description: "Don't see your student's subject? Ask us on the free consultation and we'll tell you honestly if we're a good fit.",
        details: [
            "Homework help",
            "Study habits",
            "Test review",
            "Getting ahead for next year"
        ]
    },
];

const results = [
    { before: 1110, after: 1410, label: "Official SAT Practice Test", student: "MetaMinds Student" },
];

export default function ProgramsAndResults() {
    return (
        <>
            {/* PROGRAMS SECTION */}
            <Section id="programs" className="bg-white py-14">
                <div className="text-center mb-10">
                    <motion.div initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-block mb-3">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">What We Teach</span>
                    </motion.div>
                    <motion.h2 initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
                        One tutor, matched to what your kid needs.
                    </motion.h2>
                    <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Math, science, English, and more, plus SAT prep and AP Chemistry. Every session is one on one and live online, K to 12.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
                    {programs.map((program, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: idx * 0.08 }}
                            className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-5 border border-blue-200 hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                                <program.icon className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900 mb-2">{program.title}</h3>
                            <p className="text-gray-600 text-sm mb-3 leading-relaxed">{program.description}</p>
                            <ul className="space-y-1.5">
                                {program.details.map((detail, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                        <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>{detail}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </Section>

            <section id="results" className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-14 scroll-mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <motion.div initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-block mb-3">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Real Students</span>
                    </motion.div>
                    <motion.h2 initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-4xl font-black text-white mb-3">
                        Progress you can point to.
                    </motion.h2>
                    <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-base text-blue-200 max-w-2xl mx-auto leading-relaxed">
                        Every student&apos;s progress is tracked skill by skill, session by session. Here is one real example.
                    </motion.p>
                </div>

                <div className="flex justify-center max-w-md mx-auto mb-4">
                    {results.map((result, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                            className="flex-1 bg-white rounded-xl p-5 border border-white/20 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="text-center">
                                <div className="text-xs font-bold text-gray-500 mb-4">{result.label}</div>
                                <div className="flex items-end justify-center gap-3 mb-4">
                                    <div>
                                        <div className="text-2xl font-black text-gray-400">{result.before}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">Before</div>
                                    </div>
                                    <div className="text-xl font-black text-blue-600 mb-1">→</div>
                                    <div>
                                        <div className="text-2xl font-black text-green-600">{result.after}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">After</div>
                                    </div>
                                </div>
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${(result.after / 1600) * 100}%` }} transition={{ delay: 0.3, duration: 0.8 }}
                                        className="h-full bg-gradient-to-r from-blue-500 to-green-500" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
                <p className="text-center text-xs text-slate-400">
                    Individual results vary. Shown as an example, not a guarantee.
                </p>
                </div>
            </section>
        </>
    );
}
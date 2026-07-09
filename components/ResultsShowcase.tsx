"use client";

import { motion } from "framer-motion";
import { BookOpen, Code2, Cpu, Zap, Calculator, Trophy, CheckCircle } from "lucide-react";
import Section from "./Section";

const programs = [
    {
        icon: BookOpen,
        title: "SAT & ACT Prep",
        description: "Comprehensive test preparation designed to maximize scores and college acceptance.",
        details: [
            "Full-length practice tests",
            "Targeted weak area focus",
            "Test-taking strategies",
            "College readiness guidance"
        ]
    },
    {
        icon: Calculator,
        title: "Math Concepts",
        description: "Master mathematics from elementary through advanced levels with personalized instruction.",
        details: [
            "Elementary to advanced levels",
            "Homework help & tutoring",
            "Concept mastery focus",
            "Real-world applications"
        ]
    },
    {
        icon: Code2,
        title: "Programming",
        description: "Learn coding languages and build real-world projects with hands-on experience.",
        details: [
            "Python, Java, JavaScript",
            "Web development",
            "Real project building",
            "Portfolio development"
        ]
    },
    {
        icon: Cpu,
        title: "Robotics",
        description: "Design, build, and program robots while learning engineering principles.",
        details: [
            "VEX robotics systems",
            "Mechanical engineering",
            "Autonomous programming",
            "Competition preparation"
        ]
    },
    {
        icon: Zap,
        title: "3D Printing & Design",
        description: "Learn CAD design and bring ideas to life using 3D printing technology.",
        details: [
            "CAD software mastery",
            "3D modeling design",
            "Design thinking",
            "Real-world prototyping"
        ]
    },
    {
        icon: Trophy,
        title: "Test Prep & Beyond",
        description: "Prepare for standardized tests and develop critical thinking skills.",
        details: [
            "Multiple test formats",
            "Strategic test-taking",
            "Time management",
            "Stress reduction techniques"
        ]
    }
];

const results = [
    { before: 900, after: 1300, improvement: 400, student: "Student 1" },
    { before: 1300, after: 1570, improvement: 270, student: "Student 2" },
    { before: 1380, after: 1590, improvement: 210, student: "Student 3" },
];

export default function ProgramsAndResults() {
    return (
        <>
            {/* PROGRAMS SECTION */}
            <Section id="programs" className="bg-white py-14">
                <div className="text-center mb-10">
                    <motion.div initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-block mb-3">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Comprehensive Learning</span>
                    </motion.div>
                    <motion.h2 initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
                        What We Teach
                    </motion.h2>
                    <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        From SAT/ACT prep to cutting-edge robotics and 3D design, we offer personalized tutoring across multiple disciplines.
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

                <div className="mt-10 bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-8 max-w-4xl mx-auto">
                    <h3 className="text-xl font-black text-white mb-6 text-center">Why Parents Choose Our Programs</h3>
                    <div className="grid md:grid-cols-2 gap-5 text-white">
                        {[
                            { title: "Personalized Learning", body: "Each student gets 1-on-1 attention customized to their pace and learning style." },
                            { title: "Proven Track Record", body: "Our students consistently achieve higher test scores and master complex concepts." },
                            { title: "Expert Instructors", body: "UC graduates working in their fields today, with 7+ years of teaching experience." },
                            { title: "Flexible Scheduling", body: "Evening and weekend sessions that fit your family's schedule. No long-term contracts." },
                        ].map(({ title, body }) => (
                            <div key={title} className="flex gap-3">
                                <div className="text-green-400 font-black flex-shrink-0">✓</div>
                                <div>
                                    <p className="font-bold text-sm mb-1">{title}</p>
                                    <p className="text-blue-100 text-sm">{body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            <Section id="results" className="bg-gray-50 py-14">
                <div className="text-center mb-10">
                    <motion.div initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-block mb-3">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Student Success</span>
                    </motion.div>
                    <motion.h2 initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
                        Proven Results That Speak for Themselves
                    </motion.h2>
                    <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Our students consistently achieve significant improvements in test scores, coding mastery, and academic confidence.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto mb-10">
                    {results.map((result, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                            className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-center">
                                <div className="text-xs font-bold text-gray-500 mb-4">SAT Score Improvement</div>
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
                                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg px-3 py-2 mb-4 border border-green-200">
                                    <div className="text-xl font-black text-green-600">+{result.improvement}</div>
                                    <div className="text-xs text-green-600 font-semibold">points improvement</div>
                                </div>
                                <div className="font-bold text-gray-900 text-sm mb-3">{result.student}</div>
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${(result.after / 1600) * 100}%` }} transition={{ delay: 0.3, duration: 0.8 }}
                                        className="h-full bg-gradient-to-r from-blue-500 to-green-500" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="bg-white rounded-xl p-8 max-w-4xl mx-auto border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-5 text-center">What Our Success Looks Like</h3>
                    <div className="grid md:grid-cols-2 gap-5">
                        {[
                            { title: "Higher Test Scores", body: "Students average +200 SAT point improvements and +3 ACT point increases." },
                            { title: "College Acceptance", body: "Our students gain admission to top universities including UC schools and beyond." },
                            { title: "STEM Mastery", body: "Students build working robots, create 3D designs, and develop real software projects." },
                            { title: "Confidence & Competence", body: "Students develop real skills they can use, leading to lasting confidence in academics." },
                        ].map(({ title, body }) => (
                            <div key={title} className="flex gap-3">
                                <Trophy className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-gray-900 text-sm mb-1">{title}</p>
                                    <p className="text-gray-600 text-sm">{body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>
        </>
    );
}
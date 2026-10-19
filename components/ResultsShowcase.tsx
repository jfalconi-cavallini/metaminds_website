"use client";

import { motion } from "framer-motion";
import { BookOpen, Code2, Cpu, Zap, Calculator, GraduationCap, CheckCircle } from "lucide-react";
import Section from "./Section";

const programs = [
    {
        icon: BookOpen,
        title: "SAT & ACT Prep",
        description: "Full-length practice tests, section-by-section score tracking, and a plan built around your actual weak areas — not a generic syllabus.",
        details: [
            "Full-length practice tests",
            "Targeted weak-area focus",
            "Test-day strategy",
            "College readiness guidance"
        ]
    },
    {
        icon: GraduationCap,
        title: "AP Courses",
        description: "AP-level instruction from tutors who studied this material at the college level, not just taught it from a textbook.",
        details: [
            "Calculus AB/BC, Physics, Chemistry & more",
            "Free-response & essay strategy",
            "Exam-day pacing",
            "College-credit strategy"
        ]
    },
    {
        icon: Calculator,
        title: "Math Concepts",
        description: "Elementary through calculus, with a focus on actually understanding the concept — not memorizing steps to pass the next quiz.",
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
        description: "Python, Java, and JavaScript, taught by tutors who write code professionally — building toward a real project, not just exercises.",
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
        description: "Design, build, and program robots with mentors who work in engineering — from first build to competition-ready.",
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
        description: "CAD design and hands-on 3D printing, taught by a practicing design engineer — from first sketch to a real printed part.",
        details: [
            "CAD software mastery",
            "3D modeling design",
            "Design thinking",
            "Real-world prototyping"
        ]
    },
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
                        One tutor, six directions your kid could go.
                    </motion.h2>
                    <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Test prep, math, code, and hardware — taught by tutors who work in the field, not just teach it.
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
        </>
    );
}
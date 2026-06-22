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
            <Section id="programs" className="bg-white py-24">
                <div className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block mb-6"
                    >
                        <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">Comprehensive Learning</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-black text-gray-900 mb-6"
                    >
                        What We Teach
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed"
                    >
                        From SAT/ACT prep to cutting-edge robotics and 3D design, we offer personalized tutoring across multiple disciplines. Each program is tailored to your child's learning style and goals.
                    </motion.p>
                </div>

                {/* Programs Grid - 6 items */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {programs.map((program, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border border-blue-200 hover:shadow-lg transition-shadow"
                        >
                            {/* Icon */}
                            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-6">
                                <program.icon className="w-7 h-7" />
                            </div>

                            {/* Title & Description */}
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{program.title}</h3>
                            <p className="text-gray-600 text-sm mb-6 leading-relaxed">{program.description}</p>

                            {/* Details List */}
                            <ul className="space-y-2">
                                {program.details.map((detail, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>{detail}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                {/* Why Choose Section */}
                <div className="mt-20 bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl p-12 max-w-4xl mx-auto">
                    <h3 className="text-3xl font-black text-white mb-8 text-center">Why Parents Choose Our Programs</h3>
                    <div className="grid md:grid-cols-2 gap-8 text-white">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex gap-4"
                        >
                            <div className="text-3xl flex-shrink-0">✓</div>
                            <div>
                                <p className="font-bold text-lg mb-2">Personalized Learning</p>
                                <p className="text-blue-100 text-sm">Each student gets 1-on-1 attention customized to their pace and learning style.</p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex gap-4"
                        >
                            <div className="text-3xl flex-shrink-0">✓</div>
                            <div>
                                <p className="font-bold text-lg mb-2">Proven Track Record</p>
                                <p className="text-blue-100 text-sm">Our students consistently achieve higher test scores and master complex concepts.</p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="flex gap-4"
                        >
                            <div className="text-3xl flex-shrink-0">✓</div>
                            <div>
                                <p className="font-bold text-lg mb-2">Expert Instructors</p>
                                <p className="text-blue-100 text-sm">UCSD Computer Science graduates with 10+ years of teaching experience.</p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="flex gap-4"
                        >
                            <div className="text-3xl flex-shrink-0">✓</div>
                            <div>
                                <p className="font-bold text-lg mb-2">Flexible Scheduling</p>
                                <p className="text-blue-100 text-sm">Online sessions that fit your family's schedule with no long-term contracts.</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </Section>

            {/* RESULTS SECTION */}
            <Section id="results" className="bg-gray-50 py-24">
                <div className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block mb-6"
                    >
                        <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">Student Success</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-black text-gray-900 mb-6"
                    >
                        Proven Results That Speak for Themselves
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed"
                    >
                        Our students consistently achieve significant improvements. Whether it's SAT/ACT score increases, mastering new coding languages, or building their first robot, we help students reach their goals.
                    </motion.p>
                </div>

                {/* Score Improvement Cards */}
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-24">
                    {results.map((result, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white rounded-2xl p-8 border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
                        >
                            <div className="text-center">
                                <div className="text-sm font-bold text-gray-600 mb-6">SAT Score Improvement</div>

                                {/* Score Display */}
                                <div className="flex items-end justify-center gap-4 mb-6">
                                    <div>
                                        <div className="text-3xl font-black text-gray-400">{result.before}</div>
                                        <div className="text-xs text-gray-500 font-medium mt-1">Before</div>
                                    </div>
                                    <div className="text-2xl font-black text-blue-600 mb-2">→</div>
                                    <div>
                                        <div className="text-3xl font-black text-green-600">{result.after}</div>
                                        <div className="text-xs text-gray-500 font-medium mt-1">After</div>
                                    </div>
                                </div>

                                {/* Improvement Badge */}
                                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg px-4 py-3 mb-6 border border-green-200">
                                    <div className="text-2xl font-black text-green-600">+{result.improvement}</div>
                                    <div className="text-xs text-green-600 font-semibold">points improvement</div>
                                </div>

                                {/* Student Name */}
                                <div className="font-bold text-gray-900 text-sm mb-4">{result.student}</div>

                                {/* Progress Bar */}
                                <div className="h-2 bg-gray-300 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${(result.after / 1600) * 100}%` }}
                                        transition={{ delay: 0.3, duration: 0.8 }}
                                        className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Success Stories Summary */}
                <div className="bg-white rounded-2xl p-12 max-w-4xl mx-auto border border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">What Our Success Looks Like</h3>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="flex gap-4">
                            <Trophy className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <p className="font-bold text-gray-900 mb-2">Higher Test Scores</p>
                                <p className="text-gray-600 text-sm">Students average +200 SAT point improvements and +3 ACT point increases.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Trophy className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <p className="font-bold text-gray-900 mb-2">College Acceptance</p>
                                <p className="text-gray-600 text-sm">Our students gain admission to top universities including UC schools and beyond.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Trophy className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <p className="font-bold text-gray-900 mb-2">STEM Mastery</p>
                                <p className="text-gray-600 text-sm">Students build working robots, create 3D designs, and develop real software projects.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Trophy className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <p className="font-bold text-gray-900 mb-2">Confidence & Competence</p>
                                <p className="text-gray-600 text-sm">Students develop real skills they can use, leading to lasting confidence in academics.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>
        </>
    );
}
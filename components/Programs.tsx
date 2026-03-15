"use client";

import { motion } from "framer-motion";
import { siteData } from "@/lib/data";
import Section from "./Section";
import { Trophy, Code, Cpu, Sparkles, Zap, Award, CheckCircle2 } from "lucide-react";

export default function Programs() {
    // Elite 4-tier program structure
    const programs = [
        {
            id: "explorers",
            ageRange: "Ages 6-8",
            name: "Young Explorers",
            tagline: "Foundation & Discovery",
            color: "from-emerald-500 to-teal-600",
            icon: Sparkles,
            description: "Hands-on introduction to robotics, coding, and engineering through play-based learning and creative problem-solving.",
            takeHome: [
                "Custom-built robot with ESP32 microcontroller",
                "3D-printed personalized nameplate design",
                "Programmed interactive game project"
            ],
            highlights: [
                "Block-based coding fundamentals (Scratch-style)",
                "Robot construction with sensors & motors",
                "Science experiment: Build a circuit city",
                "Daily mini-tournaments & challenges",
                "8:1 student-instructor ratio"
            ],
            skills: ["Problem Solving", "Logical Thinking", "Teamwork", "Basic Coding"]
        },
        {
            id: "innovators",
            ageRange: "Ages 9-11",
            name: "Junior Innovators",
            tagline: "Build & Program",
            color: "from-blue-500 to-indigo-600",
            icon: Code,
            description: "Advanced robotics and real programming fundamentals. Students design, build, and code autonomous robots while learning Python basics.",
            takeHome: [
                "Advanced robot kit with Arduino-compatible board",
                "Functional 3D-printed tool or gadget they designed",
                "Python-coded game with custom mechanics"
            ],
            highlights: [
                "Introduction to Python programming",
                "Autonomous robot navigation & sensors",
                "Science experiment: Solar-powered robotics",
                "Design thinking & engineering process",
                "Tournament-level robot battles"
            ],
            skills: ["Python Basics", "CAD Design", "Electronics", "Engineering Process"]
        },
        {
            id: "masters",
            ageRange: "Ages 12-13",
            name: "Tech Masters",
            tagline: "Engineer & Compete",
            color: "from-violet-500 to-purple-600",
            icon: Cpu,
            description: "Professional-level robotics engineering and software development. Build competition-grade robots and develop real applications.",
            takeHome: [
                "Competition-grade robot with ESP32/Arduino brain",
                "Advanced 3D-printed mechanical component",
                "Fully functional mobile app or web game"
            ],
            highlights: [
                "Advanced Python & JavaScript programming",
                "Multi-sensor integration & AI basics",
                "Science experiment: Machine learning demo",
                "CAD modeling for functional parts",
                "Championship tournament competition"
            ],
            skills: ["Advanced Coding", "AI Concepts", "3D CAD", "Systems Thinking"]
        },
        {
            id: "elite",
            ageRange: "Ages 14+",
            name: "Elite Engineers",
            tagline: "Innovate & Lead",
            color: "from-orange-500 to-red-600",
            icon: Trophy,
            description: "Professional engineering curriculum. Design complex systems, mentor younger students, and build portfolio-worthy projects for college applications.",
            takeHome: [
                "Custom-engineered robot with advanced capabilities",
                "Professional-grade 3D-printed invention",
                "Full-stack application or advanced game engine"
            ],
            highlights: [
                "Professional coding: Python, JavaScript, C++",
                "IoT integration & cloud connectivity",
                "Science experiment: Data science & robotics",
                "Team leadership & mentoring opportunities",
                "College portfolio-ready final project"
            ],
            skills: ["Full-Stack Development", "IoT & Cloud", "Leadership", "Portfolio Building"]
        }
    ];

    return (
        <Section id="programs" className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, rgb(139, 92, 246, 0.15) 1px, transparent 0)`,
                        backgroundSize: '32px 32px'
                    }}
                />
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-16 px-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-purple-200 text-purple-600 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6 shadow-sm"
                    >
                        <Award className="w-4 h-4" />
                        Premium Programs
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight"
                    >
                        Elite Age-Optimized{" "}
                        <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Programs
                        </span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg sm:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed mb-4"
                    >
                        Four specialized tracks engineered for maximum learning impact. Every student builds real robots, creates 3D designs,
                        and programs functional projects—<span className="font-bold text-purple-600">all to take home and keep forever</span>.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap justify-center gap-4 text-sm text-gray-600"
                    >
                        <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full border border-purple-200">
                            <Trophy className="w-4 h-4 text-purple-600" />
                            <span className="font-semibold">Tournament Competition</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full border border-purple-200">
                            <Zap className="w-4 h-4 text-purple-600" />
                            <span className="font-semibold">8:1 Student Ratio</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full border border-purple-200">
                            <Award className="w-4 h-4 text-purple-600" />
                            <span className="font-semibold">Projects to Keep</span>
                        </div>
                    </motion.div>
                </div>

                {/* Program Cards - 2x2 Grid */}
                <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 max-w-7xl mx-auto px-4">
                    {programs.map((program, idx) => {
                        const Icon = program.icon;
                        return (
                            <motion.div
                                key={program.id}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                            >
                                {/* Gradient header */}
                                <div className={`relative bg-gradient-to-r ${program.color} p-6 sm:p-8`}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-12 -translate-x-12" />

                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                                <span className="text-white text-xs font-bold tracking-wide">{program.ageRange}</span>
                                            </div>
                                            <Icon className="w-8 h-8 text-white/90" />
                                        </div>

                                        <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
                                            {program.name}
                                        </h3>
                                        <p className="text-white/90 text-sm font-semibold tracking-wide uppercase">
                                            {program.tagline}
                                        </p>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 sm:p-8">
                                    <p className="text-gray-700 leading-relaxed mb-6">
                                        {program.description}
                                    </p>

                                    {/* What They Take Home */}
                                    <div className="mb-6">
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                                            <Award className="w-4 h-4 text-purple-600" />
                                            Take Home & Keep
                                        </h4>
                                        <ul className="space-y-2">
                                            {program.takeHome.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                                    <span className="font-medium">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Program Highlights */}
                                    <div className="mb-6">
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                                            What They'll Learn
                                        </h4>
                                        <ul className="space-y-2">
                                            {program.highlights.map((highlight, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                                    <span className="text-purple-500 mt-1">•</span>
                                                    <span>{highlight}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Skills Tags */}
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                            Key Skills
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {program.skills.map((skill, i) => (
                                                <span
                                                    key={i}
                                                    className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-200"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="text-center mt-16 px-4"
                >
                    <p className="text-gray-700 text-base sm:text-lg max-w-3xl mx-auto mb-6">
                        <span className="font-bold text-purple-600">Every student</span> receives professional-grade materials,
                        expert instruction, and completed projects worth hundreds of dollars—included in tuition.
                    </p>
                    <a
                        href="#weeks"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105"
                    >
                        View Available Weeks
                        <Zap className="w-5 h-5" />
                    </a>
                </motion.div>
            </div>
        </Section>
    );
}
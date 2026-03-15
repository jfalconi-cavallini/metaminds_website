"use client";

import { motion } from "framer-motion";
import { ArrowRight, Users, Trophy, Sparkles } from "lucide-react";
import { siteData } from "@/lib/data";
import Image from "next/image";

export default function Hero() {
    return (
        <section className="relative h-screen flex flex-col bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Content Container */}
            <div className="relative flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-40 pb-6">
                <div className="max-w-7xl mx-auto w-full text-center">

                    {/* Main Headline with Quote */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-4"
                    >
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-mochi text-white mb-2 tracking-tight"
                            style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.3), 6px 6px 0px rgba(0,0,0,0.1)' }}>
                            MetaMinds STEM Academy
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-white/90 italic font-light">
                            "Ideas are free, Creating has no limits"
                        </p>
                    </motion.div>

                    {/* Info Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 sm:p-4 max-w-3xl mx-auto mb-6 shadow-xl"
                    >
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-gray-700 font-semibold text-xs sm:text-sm mb-3">
                            <div className="flex items-center gap-1.5">
                                <span className="text-base sm:text-lg">👦👧</span>
                                <span>Ages 6+</span>
                            </div>
                            <div className="hidden sm:block w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-base sm:text-lg">🕐</span>
                                <span>9 AM – 3 PM</span>
                            </div>
                            <div className="hidden sm:block w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-base sm:text-lg">📅</span>
                                <span>Week-Long Camps</span>
                            </div>
                        </div>

                        {/* Urgency Banner */}
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-2 rounded-xl inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold">
                            <span className="text-base sm:text-lg">🔥</span>
                            <span>Limited Founding Family Spots - Save $75/week</span>
                        </div>
                    </motion.div>

                    {/* Feature Pills */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap justify-center gap-3 mb-6 px-4"
                    >
                        <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-600" />
                            <span className="font-bold text-gray-800 text-sm">8:1 Student Ratio</span>
                        </div>
                        <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-indigo-600" />
                            <span className="font-bold text-gray-800 text-sm">Daily Competitions</span>
                        </div>
                        <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            <span className="font-bold text-gray-800 text-sm">All Levels Welcome</span>
                        </div>
                    </motion.div>

                    {/* Image Grid - 4 Key Features */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 px-4 max-w-6xl mx-auto"
                    >
                        {/* Build Real Robots */}
                        <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow group">
                            <div className="relative h-32 sm:h-36 bg-gray-200">
                                <Image
                                    src="/images/robot1.png"
                                    alt="Kids building robots"
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            <div className="p-3">
                                <h3 className="font-bold text-gray-800 text-base mb-1">Build Real Robots</h3>
                                <p className="text-gray-600 text-xs">Students design and build robots to take home</p>
                            </div>
                        </div>

                        {/* Learn to Code */}
                        <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow group">
                            <div className="relative h-32 sm:h-36 bg-gray-200">
                                <Image
                                    src="/images/robot2.jpg"
                                    alt="Kids learning to code"
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            <div className="p-3">
                                <h3 className="font-bold text-gray-800 text-base mb-1">Learn to Code</h3>
                                <p className="text-gray-600 text-xs">Real programming, not just copying from a screen</p>
                            </div>
                        </div>

                        {/* Hands-On Learning */}
                        <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow group">
                            <div className="relative h-32 sm:h-36 bg-gray-200">
                                <Image
                                    src="/images/robot3.jpg"
                                    alt="Hands-on engineering challenges"
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            <div className="p-3">
                                <h3 className="font-bold text-gray-800 text-base mb-1">Actual Learning</h3>
                                <p className="text-gray-600 text-xs">Real problem solving, not cookie-cutter tutorials</p>
                            </div>
                        </div>

                        {/* 3D Printing */}
                        <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow group">
                            <div className="relative h-32 sm:h-36 bg-gray-200">
                                <Image
                                    src="/images/robot1.png"
                                    alt="3D printing designs"
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            <div className="p-3">
                                <h3 className="font-bold text-gray-800 text-base mb-1">3D Printing</h3>
                                <p className="text-gray-600 text-xs">Design and print custom creations during camp</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col sm:flex-row gap-3 justify-center px-4"
                    >
                        <a
                            href={siteData.hero.formUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-base sm:text-lg hover:bg-indigo-700 transition-all shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-100 flex items-center justify-center gap-2"
                        >
                            Reserve Your Spot
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </a>
                        <a
                            href="#curriculum"
                            className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold text-base sm:text-lg hover:bg-gray-50 transition-all shadow-xl flex items-center justify-center"
                        >
                            Explore Curriculum
                        </a>
                    </motion.div>

                </div>
            </div>

            {/* Bottom gradient fade */}
            <div className="h-16 bg-gradient-to-t from-white to-transparent" />
        </section>
    );
}
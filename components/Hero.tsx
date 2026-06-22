"use client";

import { motion } from "framer-motion";
import { ArrowRight, Users, Trophy, Sparkles } from "lucide-react";
import { siteData } from "@/lib/data";
import Image from "next/image";

// 👇 REPLACE THIS with your actual Google Form URL for the free Scratch class
const FREE_CLASS_FORM_URL = "https://forms.google.com/YOUR_FORM_HERE";

export default function Hero() {
    return (
        <section className="relative min-h-screen flex flex-col bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Content Container */}
            <div className="relative flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-8">
                <div className="max-w-7xl mx-auto w-full text-center">

                    {/* Main Headline with Quote */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-4"
                    >
                        <h1
                            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-mochi text-white mb-2 tracking-tight leading-tight px-2"
                            style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.3), 6px 6px 0px rgba(0,0,0,0.1)' }}
                        >
                            MetaMinds STEM Academy
                        </h1>
                        <p
                            className="text-sm sm:text-base md:text-lg lg:text-xl text-yellow-200/90 italic font-light px-4"
                            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
                        >
                            "If You Can Dream It, You Can Build It"
                        </p>
                    </motion.div>

                    {/* Compact Info Pills - Single Row */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 mb-3 px-2"
                    >
                        <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 shadow-lg flex items-center gap-1.5">
                            <span className="text-base sm:text-lg">👦👧</span>
                            <span className="font-bold text-gray-800 text-xs sm:text-sm">Ages 6+</span>
                        </div>
                        <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 shadow-lg flex items-center gap-1.5">
                            <span className="text-base sm:text-lg">🕐</span>
                            <span className="font-bold text-gray-800 text-xs sm:text-sm">9 AM–3 PM</span>
                        </div>
                        <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 shadow-lg flex items-center gap-1.5">
                            <span className="text-base sm:text-lg">📅</span>
                            <span className="font-bold text-gray-800 text-xs sm:text-sm">Week-Long</span>
                        </div>
                        <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 shadow-lg flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
                            <span className="font-bold text-gray-800 text-xs sm:text-sm">8:1 Ratio</span>
                        </div>
                    </motion.div>

                    {/* Urgency Banner - Compact */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25 }}
                        className="mb-4 px-2"
                    >
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-xl inline-flex items-center gap-2 text-xs sm:text-sm font-bold shadow-lg">
                            <span className="text-base sm:text-lg">🔥</span>
                            <span>Limited Founding Spots - Save $75/week</span>
                        </div>
                    </motion.div>

                    {/* Image Grid - 4 Key Features */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 px-2 max-w-6xl mx-auto"
                    >
                        {/* Build Real Robots */}
                        <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 group">
                            <div className="relative h-28 sm:h-36 md:h-40 lg:h-44 bg-gray-200">
                                <Image
                                    src="/images/robot1.png"
                                    alt="Kids building robots"
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <div className="p-2.5 sm:p-3">
                                <h3 className="font-black text-gray-900 text-xs sm:text-sm md:text-base mb-0.5">Build Real Robots</h3>
                                <p className="text-gray-600 text-[10px] sm:text-xs leading-tight">Design & build robots to take home</p>
                            </div>
                        </div>

                        {/* Learn to Code */}
                        <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 group">
                            <div className="relative h-28 sm:h-36 md:h-40 lg:h-44 bg-gray-200">
                                <Image
                                    src="/images/robot3.jpg"
                                    alt="Kids learning to code"
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <div className="p-2.5 sm:p-3">
                                <h3 className="font-black text-gray-900 text-xs sm:text-sm md:text-base mb-0.5">Learn to Code</h3>
                                <p className="text-gray-600 text-[10px] sm:text-xs leading-tight">Real programming from scratch</p>
                            </div>
                        </div>

                        {/* Hands-On Learning */}
                        <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 group">
                            <div className="relative h-28 sm:h-36 md:h-40 lg:h-44 bg-gray-200">
                                <Image
                                    src="/images/arduino.jpeg"
                                    alt="Hands-on engineering challenges"
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <div className="p-2.5 sm:p-3">
                                <h3 className="font-black text-gray-900 text-xs sm:text-sm md:text-base mb-0.5">Actual Learning</h3>
                                <p className="text-gray-600 text-[10px] sm:text-xs leading-tight">Real problem solving, not tutorials</p>
                            </div>
                        </div>

                        {/* 3D Printing */}
                        <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 group">
                            <div className="relative h-28 sm:h-36 md:h-40 lg:h-44 bg-gray-200">
                                <Image
                                    src="/images/3dprinting.jpg"
                                    alt="3D printing designs"
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <div className="p-2.5 sm:p-3">
                                <h3 className="font-black text-gray-900 text-xs sm:text-sm md:text-base mb-0.5">3D Printing</h3>
                                <p className="text-gray-600 text-[10px] sm:text-xs leading-tight">Design & print custom creations</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* ✨ FREE SCRATCH CLASS BANNER */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="mb-5 px-2 max-w-6xl mx-auto"
                    >
                        <a
                            href={"https://docs.google.com/forms/d/e/1FAIpQLSdcxxB3udLysjnkefuWUAOwTMGa3R37CAHSAQxvAMhfU9r6Wg/viewform"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/15 backdrop-blur-sm border-2 border-white/40 rounded-2xl px-5 py-4 hover:bg-white/25 transition-all cursor-pointer"
                        >
                            {/* Left: icon + text */}
                            <div className="flex items-center gap-3 text-left">
                                <div className="text-3xl sm:text-4xl flex-shrink-0">🎓</div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="bg-yellow-400 text-yellow-900 text-[10px] sm:text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                                            Free
                                        </span>
                                        <span className="text-white font-black text-sm sm:text-base md:text-lg leading-tight">
                                            Try a Free Scratch Coding Class
                                        </span>
                                    </div>
                                    <p className="text-white/80 text-xs sm:text-sm mt-0.5 leading-snug">
                                        No commitment — see what your child will learn before enrolling in camp
                                    </p>
                                </div>
                            </div>

                            {/* Right: CTA pill */}
                            <div className="flex-shrink-0 bg-yellow-400 text-yellow-900 font-black text-xs sm:text-sm px-4 py-2 rounded-xl group-hover:bg-yellow-300 transition-colors flex items-center gap-1.5 whitespace-nowrap">
                                Claim Your Spot!
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </a>
                    </motion.div>

                    {/* CTA Buttons - Compact */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center px-4"
                    >
                        <a
                            href={siteData.hero.formUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group bg-white text-indigo-600 px-6 sm:px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base hover:bg-gray-50 transition-all shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-100 flex items-center justify-center gap-2"
                        >
                            Reserve Your Spot
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                        </a>
                        <a
                            href="#programs"
                            className="bg-indigo-700/80 backdrop-blur-sm text-white px-6 sm:px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base hover:bg-indigo-800 transition-all shadow-xl flex items-center justify-center border-2 border-white/20"
                        >
                            View Programs
                        </a>
                    </motion.div>

                </div>
            </div>
        </section >
    );
}
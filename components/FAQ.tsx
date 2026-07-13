"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, CheckCircle, Send, User, Mail, MessageSquare } from "lucide-react";
import { siteData } from "@/lib/data";
import Section from "./Section";
import emailjs from "@emailjs/browser";
import CalendlyButton from "./CalendlyButton";

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: "", email: "", message: "", honeypot: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
    const [errors, setErrors] = useState({ name: "", email: "", message: "" });

    // Email validation
    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Form validation
    const validateForm = () => {
        const newErrors = { name: "", email: "", message: "" };
        let isValid = true;

        if (formData.name.trim().length < 2) {
            newErrors.name = "Name must be at least 2 characters";
            isValid = false;
        }

        if (!validateEmail(formData.email)) {
            newErrors.email = "Please enter a valid email address";
            isValid = false;
        }

        if (formData.message.trim().length < 10) {
            newErrors.message = "Message must be at least 10 characters";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Honeypot check (spam bot protection)
        if (formData.honeypot) {
            console.log("Bot detected");
            return;
        }

        // Validate form
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        
        try {
            // Send email using EmailJS
            await emailjs.send(
                process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
                process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
                {
                    name: formData.name,
                    email: formData.email,
                    message: formData.message,
                },
                process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
            );
            
            setSubmitStatus("success");
            setFormData({ name: "", email: "", message: "", honeypot: "" });
            setErrors({ name: "", email: "", message: "" });
        } catch (error) {
            console.error("EmailJS Error:", error);
            setSubmitStatus("error");
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setSubmitStatus("idle"), 5000);
        }
    };

    return (
        <>
        <Section id="faq" className="bg-white">
            {/* Header */}
            <div className="text-center mb-16 px-4">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6"
                >
                    <HelpCircle className="w-4 h-4" />
                    Got Questions?
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight"
                >
                    Parents Ask.{" "}
                    <span className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
                        We Answer
                    </span>
                    .
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
                >
                    Everything you need to know about our tutoring programs, scheduling, and pricing.
                    Can&apos;t find your answer? Use the form below.
                </motion.p>
            </div>

            {/* FAQ Items */}
            <div className="max-w-4xl mx-auto px-4 space-y-4">
                {siteData.faqs.map((faq, idx) => {
                    const isOpen = openIndex === idx;
                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: idx * 0.05, duration: 0.4 }}
                            className={`group rounded-2xl overflow-hidden border-2 transition-all duration-300 ${isOpen
                                ? "border-blue-400 shadow-xl shadow-blue-100/50"
                                : "border-gray-200 hover:border-blue-300 shadow-md hover:shadow-lg"
                                }`}
                        >
                            {/* Question Button */}
                            <button
                                type="button"
                                onClick={() => setOpenIndex(isOpen ? null : idx)}
                                className={`w-full flex justify-between items-start gap-4 px-6 sm:px-8 py-5 sm:py-6 text-left transition-all duration-300 ${isOpen
                                    ? "bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700"
                                    : "bg-white group-hover:bg-gray-50"
                                    }`}
                            >
                                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                                    <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-sm sm:text-base transition-all duration-300 ${isOpen
                                        ? "bg-white/20 text-white"
                                        : "bg-blue-100 text-blue-600 group-hover:bg-blue-200"
                                        }`}>
                                        {idx + 1}
                                    </div>
                                    <span className={`font-bold text-base sm:text-lg leading-tight pt-1 ${isOpen ? "text-white" : "text-gray-900"
                                        }`}>
                                        {faq.question}
                                    </span>
                                </div>
                                <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen
                                    ? "bg-white/20"
                                    : "bg-blue-50 border-2 border-blue-100 group-hover:border-blue-200"
                                    }`}>
                                    <ChevronDown
                                        className={`w-5 h-5 transition-transform duration-300 ${isOpen ? "rotate-180 text-white" : "text-blue-600"
                                            }`}
                                    />
                                </div>
                            </button>

                            {/* Answer */}
                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
                                        className="overflow-hidden bg-gradient-to-br from-gray-50 to-white"
                                    >
                                        <div className="px-6 sm:px-8 py-5 sm:py-6 border-t-2 border-blue-100">
                                            <div className="flex items-start gap-3">
                                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                                                    {faq.answer}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

        </Section>
        <Section id="contact" className="bg-white">

            {/* Contact Header */}
            <div className="text-center mb-12 px-4">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6"
                >
                    <Mail className="w-4 h-4" />
                    Contact Us
                </motion.div>
                <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight"
                >
                    Get In{" "}
                    <span className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
                        Touch
                    </span>
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-gray-600 max-w-2xl mx-auto"
                >
                    Have a question or ready to get started? We&apos;ll get back to you within 24 hours.
                </motion.p>
            </div>

            {/* Contact Form Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-16 px-4"
            >
                <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-6 sm:p-10 max-w-3xl mx-auto border-2 border-blue-200">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
                            Still Have Questions?
                        </h3>
                        <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                            Send us a message and we&apos;ll get back to you within 24 hours!
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Honeypot field (hidden from users, catches bots) */}
                        <input
                            type="text"
                            name="website"
                            value={formData.honeypot}
                            onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                            style={{ display: "none" }}
                            tabIndex={-1}
                            autoComplete="off"
                        />

                        {/* Name Field */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2">
                                Your Name *
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData({ ...formData, name: e.target.value });
                                        setErrors({ ...errors, name: "" });
                                    }}
                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${errors.name ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:outline-none transition-colors text-gray-900 bg-white`}
                                    placeholder="John Doe"
                                />
                            </div>
                            {errors.name && <p className="text-red-600 text-xs mt-1 ml-1">{errors.name}</p>}
                        </div>

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                                Email Address *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    id="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value });
                                        setErrors({ ...errors, email: "" });
                                    }}
                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${errors.email ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:outline-none transition-colors text-gray-900 bg-white`}
                                    placeholder="parent@example.com"
                                />
                            </div>
                            {errors.email && <p className="text-red-600 text-xs mt-1 ml-1">{errors.email}</p>}
                        </div>

                        {/* Message Field */}
                        <div>
                            <label htmlFor="message" className="block text-sm font-bold text-gray-700 mb-2">
                                Your Question *
                            </label>
                            <div className="relative">
                                <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                                <textarea
                                    id="message"
                                    required
                                    rows={4}
                                    value={formData.message}
                                    onChange={(e) => {
                                        setFormData({ ...formData, message: e.target.value });
                                        setErrors({ ...errors, message: "" });
                                    }}
                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${errors.message ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:outline-none transition-colors text-gray-900 bg-white resize-none`}
                                    placeholder="What would you like to know about our tutoring programs?"
                                />
                            </div>
                            {errors.message && <p className="text-red-600 text-xs mt-1 ml-1">{errors.message}</p>}
                        </div>

                        {/* Submit Button */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 bg-gradient-to-r from-blue-700 to-blue-500 text-white px-6 py-4 rounded-xl font-bold text-base hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Send Message
                                    </>
                                )}
                            </button>
                            
                            <CalendlyButton className="flex-1 bg-white text-blue-600 px-6 py-4 rounded-xl font-bold text-base border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all flex items-center justify-center gap-2">
                                Book Free Consultation
                            </CalendlyButton>
                        </div>

                        {/* Status Messages */}
                        {submitStatus === "success" && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Message sent! We&apos;ll respond within 24 hours.
                            </motion.div>
                        )}
                        {submitStatus === "error" && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold"
                            >
                                ⚠️ Something went wrong. Please try emailing us directly at {siteData.brand?.email || 'metamindsstemacademy@gmail.com'}
                            </motion.div>
                        )}
                    </form>
                </div>
            </motion.div>
        </Section>
        </>
    );
}
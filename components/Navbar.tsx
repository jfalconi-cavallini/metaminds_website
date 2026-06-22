"use client";

import Link from "next/link";
import { siteData } from "@/lib/data";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="fixed top-0 w-full h-20 bg-white shadow-sm z-50">
            <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <img src="/images/metaminds-logo2.png" alt="Logo" className="h-24 w-auto object-contain" />
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    <Link href="#" className="text-gray-700 hover:text-gray-900 font-medium text-sm">Home</Link>
                    <Link href="#programs" className="text-gray-700 hover:text-gray-900 font-medium text-sm">Programs</Link>
                    <Link href="#results" className="text-gray-700 hover:text-gray-900 font-medium text-sm">Success Stories</Link>
                    <Link href="#faq" className="text-gray-700 hover:text-gray-900 font-medium text-sm">About</Link>
                    <Link href="#contact" className="text-gray-700 hover:text-gray-900 font-medium text-sm">Contact</Link>
                    
                </div>

                {/* CTA Button */}
                <a
                    href={siteData.hero?.formUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden md:inline-flex px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                    Book Free Consultation
                </a>

                {/* Mobile Menu Button */}
                <button onClick={() => setIsOpen(!isOpen)} className="md:hidden">
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white border-t border-gray-200 p-4 space-y-3">
                    <Link href="#" className="block text-gray-700 font-medium py-2 text-sm">Home</Link>
                    <Link href="#programs" className="block text-gray-700 font-medium py-2 text-sm">Programs</Link>
                    <Link href="#results" className="block text-gray-700 font-medium py-2 text-sm">Success Stories</Link>
                    <Link href="#" className="block text-gray-700 font-medium py-2 text-sm">About</Link>
                    <Link href="#FAQ" className="block text-gray-700 font-medium py-2 text-sm">Contact</Link>
                    <a
                        href={siteData.hero?.formUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg text-center text-sm"
                    >
                        Book Free Consultation
                    </a>
                </div>
            )}
        </nav>
    );
}
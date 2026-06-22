import Link from "next/link";
import { siteData } from "@/lib/data";

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-white py-16">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-white rounded-xl px-3 py-2 inline-flex">
                                <img src="/images/metaminds-logo2.png" alt="MetaMinds Logo" className="h-12 w-auto object-contain" />
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm">Expert tutoring in SAT, ACT, Math, Coding, and Robotics.</p>
                    </div>

                    {/* Contact */}
                    <div>
                        <div className="font-bold mb-4">Contact</div>
                        <div className="text-gray-400 text-sm space-y-2">
                            <p>{siteData.brand?.email}</p>
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <div className="font-bold mb-4">Follow Us</div>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li><a href="https://www.facebook.com/people/MetaMinds-Stem-Academy/61588028801791/" target="_blank" rel="noopener noreferrer" className="hover:text-white">Facebook</a></li>
                            <li><a href="https://www.instagram.com/metamindsstemacademy/" target="_blank" rel="noopener noreferrer" className="hover:text-white">Instagram</a></li>
                        </ul>
                    </div>

                    {/* CTA */}
                    <div>
                        <div className="font-bold mb-4">Quick Links</div>
                        <a
                            href={siteData.hero?.formUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700"
                        >
                            Book Consultation
                        </a>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 text-center text-gray-400 text-sm">
                    <p>&copy; 2024 MetaMinds STEM Academy. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
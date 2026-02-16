import Link from "next/link";
import { siteData } from "@/lib/data";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Link
                        href="/"
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">
                    Privacy Policy
                </h1>

                <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6 text-gray-700 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                            Our Commitment to Privacy
                        </h2>
                        <p>
                            At {siteData.brand.name}, we take the privacy and safety of your
                            children seriously. This policy outlines how we collect, use, and
                            protect information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                            Information We Collect
                        </h2>
                        <p>
                            We collect only the information necessary to run a safe and
                            effective camp program:
                        </p>
                        <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
                            <li>Parent/guardian contact information</li>
                            <li>Child's name, age, and emergency contacts</li>
                            <li>Medical information and allergies</li>
                            <li>Photo/video consent preferences</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                            How We Use Information
                        </h2>
                        <p>Your information is used exclusively to:</p>
                        <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
                            <li>Communicate about camp schedules and updates</li>
                            <li>Ensure child safety during activities</li>
                            <li>Process registration and payments</li>
                            <li>Share photos/videos (only with explicit consent)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                            Data Protection
                        </h2>
                        <p>
                            We implement industry-standard security measures to protect your
                            data. Information is stored securely and never sold or shared with
                            third parties for marketing purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                            Photo & Video Policy
                        </h2>
                        <p>
                            We love celebrating student achievements! Photos and videos may be
                            taken during camp for:
                        </p>
                        <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
                            <li>Sharing with parents via secure platforms</li>
                            <li>Marketing materials (only with explicit consent)</li>
                            <li>Social media (only with explicit consent)</li>
                        </ul>
                        <p className="mt-2">
                            Parents can opt out of photo/video sharing at any time.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                            Your Rights
                        </h2>
                        <p>You have the right to:</p>
                        <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
                            <li>Request a copy of your data</li>
                            <li>Request corrections to your data</li>
                            <li>Request deletion of your data</li>
                            <li>Withdraw photo/video consent</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                            Contact Us
                        </h2>
                        <p>
                            Questions about privacy? Contact us at{" "}
                            <a
                                href={`mailto:${siteData.brand.email}`}
                                className="text-indigo-600 hover:text-indigo-700 underline"
                            >
                                {siteData.brand.email}
                            </a>
                        </p>
                    </section>

                    <p className="text-sm text-gray-500 pt-6 border-t border-gray-200">
                        Last updated: February 2026
                    </p>
                </div>
            </div>
        </div >
    );
}
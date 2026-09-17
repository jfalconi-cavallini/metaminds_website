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
                            We collect only what we need to run safe, effective 1-on-1 tutoring: parent contact info, student name/grade/goals, and scheduling details. We do not sell your data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                            Information We Collect
                        </h2>
                        <p>
                            At {siteData.brand.name}, we collect only what is needed to deliver tutoring and mentoring:
                        </p>
                        <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
                            <li>Parent/guardian contact information</li>
                            <li>Student name, grade, and learning goals</li>
                            <li>Scheduling details</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                            How We Use Information
                        </h2>
                        <p>Your information is used exclusively to:</p>
                        <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
                            <li>Communicate about sessions, scheduling, and updates</li>
                            <li>Deliver 1-on-1 tutoring and mentoring</li>
                            <li>Process registration and payments</li>
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
                            Your Rights
                        </h2>
                        <p>You have the right to:</p>
                        <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
                            <li>Request a copy of your data</li>
                            <li>Request corrections to your data</li>
                            <li>Request deletion of your data</li>
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
                        Last updated: September 2026
                    </p>
                </div>
            </div>
        </div >
    );
}

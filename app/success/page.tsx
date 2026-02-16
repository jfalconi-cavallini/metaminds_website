import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function SuccessPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
                <div className="flex justify-center mb-6">
                    <CheckCircle2 className="w-20 h-20 text-green-500" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Registration Submitted!
                </h1>

                <p className="text-gray-600 mb-2">
                    Thank you for registering with MetaMinds STEM Academy.
                </p>

                <p className="text-gray-600 mb-8">
                    We'll review your submission and send a confirmation email within 24
                    hours with next steps and location details.
                </p>

                <div className="space-y-3">
                    <Link
                        href="/"
                        className="block w-full bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                    >
                        Back to Home
                    </Link>

                    <p className="text-sm text-gray-500">
                        Questions?{" "}

                        href="mailto:hello@metamindsstem.com"
                        className="text-indigo-600 hover:text-indigo-700 underline"
            >
                        Contact us
                    </a>
                </p>
            </div>
        </div>
    </div >
  );
}
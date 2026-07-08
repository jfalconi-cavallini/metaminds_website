"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { siteData } from "@/lib/data";

export default function LoginPage() {
  const router = useRouter();

  // Login state
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  // Forgot-password state
  const [mode,        setMode]        = useState<"login" | "reset" | "reset-sent">("login");
  const [resetEmail,  setResetEmail]  = useState("");
  const [resetError,  setResetError]  = useState("");
  const [resetLoading,setResetLoading]= useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (!profile) {
      setError("Account not set up correctly. Contact MetaMinds support.");
      setLoading(false);
      return;
    }

    if (profile.role === "admin")       router.push("/portal/admin");
    else if (profile.role === "tutor")  router.push("/portal/tutor");
    else                                router.push("/portal/student");
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (resetErr) {
      setResetError(resetErr.message);
    } else {
      setMode("reset-sent");
    }
  }

  return (
    <>
      <Navbar />

      <main className="pt-24 min-h-screen bg-gray-50">
        <section className="max-w-md mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

            <div className="flex justify-center mb-6">
              <img src="/images/metaminds-logo2.png" alt="MetaMinds" className="h-16 w-auto" />
            </div>

            {mode === "login" && (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in to MetaMinds</h1>
                <p className="text-gray-500 text-sm mb-6">
                  Accounts are created for enrolled families. No account yet?{" "}
                  <a href={siteData.hero?.formUrl || "#"} onClick={(e) => { e.preventDefault(); (window as any).Calendly?.initPopupWidget({ url: siteData.hero?.formUrl }); }}
                    className="text-blue-600 hover:underline cursor-pointer">
                    Book a free consultation.
                  </a>
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <input type="email" placeholder="Email address" value={email}
                    onChange={(e) => setEmail(e.target.value)} required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="password" placeholder="Password" value={password}
                    onChange={(e) => setPassword(e.target.value)} required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="submit" disabled={loading}
                    className="w-full rounded-lg bg-blue-600 text-white font-semibold py-3 text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {loading ? "Signing in…" : "Sign In"}
                  </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-4">
                  Forgot your password?{" "}
                  <button onClick={() => { setMode("reset"); setResetEmail(email); }}
                    className="text-blue-600 hover:underline">
                    Reset it here.
                  </button>
                </p>
              </>
            )}

            {mode === "reset" && (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
                <p className="text-gray-500 text-sm mb-6">
                  Enter your email and we&apos;ll send you a link to set a new password.
                </p>

                {resetError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
                    {resetError}
                  </div>
                )}

                <form onSubmit={handleReset} className="space-y-4">
                  <input type="email" placeholder="Email address" value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)} required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="submit" disabled={resetLoading}
                    className="w-full rounded-lg bg-blue-600 text-white font-semibold py-3 text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {resetLoading ? "Sending…" : "Send Reset Link"}
                  </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-4">
                  <button onClick={() => setMode("login")} className="text-blue-600 hover:underline">
                    Back to sign in
                  </button>
                </p>
              </>
            )}

            {mode === "reset-sent" && (
              <>
                <div className="text-center">
                  <div className="text-4xl mb-4">✉️</div>
                  <h1 className="text-xl font-bold text-gray-900 mb-2">Check your email</h1>
                  <p className="text-gray-500 text-sm mb-6">
                    We sent a password reset link to <strong>{resetEmail}</strong>. Click the link in the email to set a new password.
                  </p>
                  <button onClick={() => setMode("login")} className="text-blue-600 hover:underline text-sm">
                    Back to sign in
                  </button>
                </div>
              </>
            )}

          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

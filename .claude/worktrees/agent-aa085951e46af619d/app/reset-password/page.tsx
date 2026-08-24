"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [done,      setDone]      = useState(false);
  const [sessionOk, setSessionOk] = useState(false);

  // Supabase puts the recovery token in the URL hash; getSession() resolves it automatically
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionOk(true);
      else setError("This reset link is invalid or has expired. Please request a new one.");
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6)  { setError("Password must be at least 6 characters."); return; }
    setSaving(true);
    setError("");
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateErr) { setError(updateErr.message); return; }
    setDone(true);
    setTimeout(() => router.push("/login"), 3000);
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

            {done ? (
              <div className="text-center">
                <div className="text-4xl mb-4">✅</div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">Password updated!</h1>
                <p className="text-gray-500 text-sm">Redirecting you to sign in…</p>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h1>
                <p className="text-gray-500 text-sm mb-6">Choose a new password for your account.</p>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
                    {error}
                    {!sessionOk && (
                      <p className="mt-2">
                        <a href="/login" className="underline text-red-600">Back to sign in</a>
                      </p>
                    )}
                  </div>
                )}

                {sessionOk && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="password" placeholder="New password" value={password}
                      onChange={(e) => setPassword(e.target.value)} required minLength={6}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="password" placeholder="Confirm new password" value={confirm}
                      onChange={(e) => setConfirm(e.target.value)} required minLength={6}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="submit" disabled={saving}
                      className="w-full rounded-lg bg-blue-600 text-white font-semibold py-3 text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
                      {saving ? "Saving…" : "Update Password"}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail) return;
    
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 p-4">
      <div className="w-full max-w-sm space-y-8 bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-zinc-900">Building Check-In</h1>
            <p className="text-sm text-zinc-500 font-medium">Secure Access Portal</p>
          </div>
        </div>

        {!showForgotPassword ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>

            <button
              type="button"
              onClick={() => { setShowForgotPassword(true); setError(""); }}
              className="w-full text-xs text-indigo-600 hover:text-indigo-800 font-bold transition-colors py-2 border-t border-zinc-100"
            >
              Forgot Password? Reset here
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            {resetSent ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <svg className="w-10 h-10 text-emerald-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-bold text-emerald-700">Check your email</p>
                <p className="text-xs text-emerald-600 mt-1">We've sent password reset instructions.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-zinc-600">Enter your email and we'll send you reset instructions.</p>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Email Address</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    placeholder="name@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
                >
                  {resetLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => { setShowForgotPassword(false); setResetSent(false); setResetEmail(""); setError(""); }}
              className="w-full text-xs text-zinc-500 hover:text-indigo-600 font-medium transition-colors"
            >
              ← Back to Sign In
            </button>
          </form>
        )}

        <p className="text-[10px] text-center text-zinc-400 uppercase tracking-widest font-bold">
          © 2026 Building Management System
        </p>
      </div>
    </div>
  );
}

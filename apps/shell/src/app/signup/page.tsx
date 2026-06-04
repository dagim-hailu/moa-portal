"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Mail, UserCircle2 } from "lucide-react";
import { validateEmail, validatePassword, validateUsername } from "../../lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const username = String(formData.get("username") ?? "").trim().toLowerCase();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!fullName) {
      setError("Full name is required");
      return;
    }

    if (!validateUsername(username)) {
      setError("Username must be 3-32 characters and use letters, numbers, dots, dashes, or underscores");
      return;
    }

    if (!validateEmail(email)) {
      setError("Enter a valid email address");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be 8+ chars and include upper, lower, number, and symbol");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName, username, email, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error || "Failed to create account");
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6] p-4 font-sans">
      <div className="w-full max-w-[440px] rounded-2xl bg-white px-8 py-10 shadow-xl">
        <Link href="/login" className="mb-6 flex items-center text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to sign in
        </Link>
        
        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500">Usernames are unique and passwords must satisfy the portal security policy.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Full Name</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <UserCircle2 className="h-4 w-4 text-gray-400" />
              </div>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                name="fullName"
                type="text"
                placeholder="Your full name"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Username</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <UserCircle2 className="h-4 w-4 text-gray-400" />
              </div>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                name="username"
                type="text"
                placeholder="username"
                minLength={3}
                maxLength={32}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Email</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Password</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                name="password"
                type="password"
                placeholder="Min. 8 chars, upper/lower/number/symbol"
                minLength={8}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Confirm Password</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                name="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                minLength={8}
                required
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-[#0F172A] py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#1E293B] active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}

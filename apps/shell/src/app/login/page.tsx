"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@moa/shared/i18n";
import { Lock, ArrowLeft, UserCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const locale = "en"; // defaulting to English as per design

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const identifier = String(formData.get("identifier") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!identifier || !password) {
      setError(t(locale, "auth.invalid"));
      return;
    }

    setLoading(true);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier, password, locale }),
    });
    setLoading(false);

    if (!response.ok) {
      setError(t(locale, "auth.invalid"));
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6] p-4 font-sans">
      <div className="w-full max-w-[440px] rounded-2xl bg-white px-8 py-10 shadow-xl">
        <Link href="/" className="mb-6 flex items-center text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2ea354] shadow-sm mb-6">
            <Image 
              src="/assets/images/favicon_io/favicon.png" 
              alt="Logo" 
              width={32} 
              height={32} 
              className="brightness-0 invert"
            />
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Welcome to AgriHub</h1>
          <p className="mt-2 text-sm font-medium text-[#64748B]">Sign in with your email or username to continue</p>
        </div>

        <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200">
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            <path d="M1 1h22v22H1z" fill="none"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative my-8 flex items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="mx-4 text-xs font-semibold uppercase text-gray-400">or</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Email or Username</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <UserCircle2 className="h-4 w-4 text-gray-400" />
              </div>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                name="identifier"
                type="text"
                placeholder="you@example.com or username"
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
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-[#0F172A] py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#1E293B] active:scale-[0.98]"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-between text-sm">
          <Link href="#" className="font-medium text-[#64748B] hover:text-[#0F172A] hover:underline">
            Forgot password?
          </Link>
          <p className="text-[#64748B]">
            Need an account?{" "}
            <Link href="/signup" className="font-semibold text-[#0F172A] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

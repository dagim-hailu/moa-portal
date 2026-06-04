"use client";

import { Search, Bell, ChevronDown, User, Globe, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Locale } from "@moa/shared/i18n";

type HeaderProps = {
  userName: string;
  locale?: Locale;
};

export function Header({ userName, locale = "en" }: HeaderProps) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 flex h-[76px] items-center justify-between border-b border-border bg-white px-8 shadow-sm">
      <div className="flex-1">
        <label className="flex w-full max-w-[560px] items-center gap-3 rounded-lg bg-slate-50 border border-slate-200 px-4 py-2 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            placeholder="Search documents, files..."
            aria-label={t(locale, "common.search")}
          />
        </label>
      </div>
      <div className="flex items-center gap-6">
        <button className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition">
          <Globe className="h-5 w-5" />
          <span className="text-sm font-medium uppercase">{locale}</span>
        </button>
        <button className="relative text-slate-500 hover:text-slate-700 transition">
          <Bell className="h-5 w-5" />
          <span className="absolute right-0.5 top-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded-lg transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A7554] text-sm font-medium text-white shadow-inner">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-slate-700">{userName}</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-white shadow-lg overflow-hidden z-20">
              <div className="py-1">
                <button
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                  onClick={() => setProfileOpen(false)}
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  Settings
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="h-4 w-4 text-red-400" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

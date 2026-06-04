"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface NavbarProps {
  userName: string;
  userEmail: string;
  onOpenMenu: () => void;
}

export function Navbar({ userName, userEmail, onOpenMenu }: NavbarProps) {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsActive, setNotificationsActive] = useState(true);
  const profileRef = useRef<HTMLDivElement>(null);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "light";
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Handle click outside profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleNotificationClick = () => {
    alert('🌾 You have 2 new notifications: "Rainy season advisory" & "Fertilizer subsidy extension".');
    setNotificationsActive(false);
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Logout from MOA Digital?")) {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    }
  };

  const handleViewProfile = (e: React.MouseEvent) => {
    e.preventDefault();
    alert(`📋 Personal Information panel — ID: ABEL-024, Region: Addis Ababa`);
    setProfileOpen(false);
  };

  return (
    <nav className="flex justify-between items-center px-[8%] py-[18px] bg-[var(--nav-bg)] backdrop-blur-[12px] sticky top-0 z-[1000] border-b border-[var(--border-color)]">
      <div className="flex items-center gap-5">
        <div 
          className="text-[1.3rem] color-[var(--text-main)] cursor-pointer p-2 rounded-lg bg-[var(--bg-secondary)] transition-transform hover:scale-105 hover:text-[var(--primary-green)]"
          id="openMenu"
          onClick={onOpenMenu}
        >
          <i className="fa-solid fa-bars"></i>
        </div>
        <div className="font-extrabold text-[1.4rem] text-[var(--primary-green)] tracking-[-0.5px]">MOA Digital</div>
      </div>
      
      <ul className="hidden md:flex gap-[35px] list-none">
        <li><Link href="/" className="no-underline text-[var(--text-muted)] font-semibold text-[0.95rem] hover:text-[var(--primary-green)]">Home</Link></li>
        <li><Link href="/about" className="no-underline text-[var(--text-muted)] font-semibold text-[0.95rem] hover:text-[var(--primary-green)]">About</Link></li>
        <li><Link href="/contact" className="no-underline text-[var(--text-muted)] font-semibold text-[0.95rem] hover:text-[var(--primary-green)]">Connect</Link></li>
        <li><a href="#logout" onClick={handleLogout} className="no-underline text-[var(--text-muted)] font-semibold text-[0.95rem] hover:text-[var(--primary-green)]">LogOut</a></li>
      </ul>

      <div className="flex items-center gap-[15px]">
        <div 
          className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-[1.1rem] cursor-pointer border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] hover:border-[var(--primary-green)] hover:text-[var(--primary-green)]"
          onClick={toggleTheme}
        >
          <i className={`fa-solid ${theme === "light" ? "fa-moon" : "fa-sun"}`}></i>
        </div>
        
        <div 
          className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-[1.1rem] cursor-pointer border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] relative hover:border-[var(--primary-green)] hover:text-[var(--primary-green)]"
          onClick={handleNotificationClick}
        >
          <i className="fa-regular fa-bell"></i>
          {notificationsActive && <span className="absolute top-[10px] right-[12px] w-2 h-2 bg-[#ef4444] rounded-full shadow-[0_0_0_2px_var(--card-bg)]"></span>}
        </div>

        <div className="relative" ref={profileRef}>
          <div 
            className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-[1.1rem] cursor-pointer bg-[var(--primary-green)] text-white border-none hover:bg-[var(--primary-hover)]"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <i className="fa-regular fa-user"></i>
          </div>
          
          <div className={`absolute top-[55px] right-0 w-[260px] bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[16px] shadow-[var(--shadow-lg)] p-[10px] transition-all duration-300 z-[1001] ${profileOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-[-10px]'}`}>
            <div className="p-[15px] text-center">
              <h4 className="text-[1.1rem] text-[var(--text-main)] mb-1">{userName}</h4>
              <p className="text-[0.85rem] text-[var(--text-muted)]">{userEmail}</p>
            </div>
            <hr className="border-none border-t border-[var(--border-color)] my-[5px]" />
            <a href="#personal-info" onClick={handleViewProfile} className="flex items-center gap-3 p-[12px_15px] no-underline text-[var(--text-main)] text-[0.95rem] font-medium rounded-[12px] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--primary-green)] group">
              <i className="fa-regular fa-id-card w-5 text-center text-[var(--text-muted)] group-hover:text-[var(--primary-green)]"></i> Personal Information
            </a>
            <Link href="/settings" className="flex items-center gap-3 p-[12px_15px] no-underline text-[var(--text-main)] text-[0.95rem] font-medium rounded-[12px] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--primary-green)] group">
              <i className="fa-solid fa-gear w-5 text-center text-[var(--text-muted)] group-hover:text-[var(--primary-green)]"></i> Account Settings
            </Link>
            <Link href="/help" className="flex items-center gap-3 p-[12px_15px] no-underline text-[var(--text-main)] text-[0.95rem] font-medium rounded-[12px] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--primary-green)] group">
              <i className="fa-regular fa-circle-question w-5 text-center text-[var(--text-muted)] group-hover:text-[var(--primary-green)]"></i> Help & Support
            </Link>
            <hr className="border-none border-t border-[var(--border-color)] my-[5px]" />
            <a href="#logout" onClick={handleLogout} className="flex items-center gap-3 p-[12px_15px] no-underline text-[#ef4444] text-[0.95rem] font-medium rounded-[12px] transition-colors hover:bg-[rgba(239,68,68,0.1)] group">
              <i className="fa-solid fa-arrow-right-from-bracket w-5 text-center text-[#ef4444]"></i> Logout
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

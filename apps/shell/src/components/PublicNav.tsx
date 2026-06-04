"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#updates", label: "Updates" },
  { href: "/#partners", label: "Partners" },
  { href: "/#community", label: "Community" },
  { href: "/#testimonials", label: "Testimonials" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function PublicNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    if (pathname !== "/") {
      setActiveHash("");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHash(`#${entry.target.id}`);
          }
        });
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0.1 }
    );

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((s) => observer.observe(s));

    // Also set initial hash based on window.location.hash if present
    if (window.location.hash) {
      setActiveHash(window.location.hash);
    }

    return () => observer.disconnect();
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-50 border-b border-[#DCE5E0] bg-white/95 shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 leading-none">
          <Image
            src="/assets/images/favicon_io/apple-touch-icon.png"
            alt="MOA Logo"
            width={52}
            height={52}
            className="rounded-lg"
          />
          <span className="font-bold text-gray-900 text-sm md:text-base">
            Ministry of Agriculture
          </span>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => {
            const isHashLink = link.href.includes("#");
            const linkHash = isHashLink ? `#${link.href.split("#")[1]}` : "";
            
            let isActive = false;
            if (pathname === "/") {
              if (link.href === "/") {
                isActive = activeHash === "" || activeHash === "#hero";
              } else if (isHashLink) {
                isActive = activeHash === linkHash;
              }
            } else {
              if (!isHashLink && link.href !== "/") {
                isActive = pathname.startsWith(link.href);
              }
            }

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`text-sm transition-colors hover:text-[#1A7554] ${
                    isActive ? "text-[#1A7554] font-semibold" : "text-gray-600 font-medium"
                  }`}
                  onClick={() => {
                    if (isHashLink) {
                      setActiveHash(linkHash);
                    }
                  }}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-[#1A7554] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#154735] active:scale-[0.98]"
          >
            Get Started
          </Link>
          {/* Mobile hamburger */}
          <button
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-[#DCE5E0] bg-white px-6 pb-4 md:hidden">
          <ul className="flex flex-col gap-3 pt-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block py-1 text-sm font-medium text-gray-700 hover:text-[#1A7554]"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/login"
                className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[#1A7554] px-5 py-2.5 text-sm font-semibold text-white shadow-md"
                onClick={() => setMenuOpen(false)}
              >
                Get Started
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}

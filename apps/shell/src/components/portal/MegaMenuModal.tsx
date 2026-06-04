"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

interface MenuItem {
  id: string;
  title: string;
  desc: string;
  icon: string;
  href: string;
  label: string;
}

const menuItems: MenuItem[] = [
  { id: "holiday", title: "Holiday Calendar", desc: "View national agricultural holidays, planting seasons, and farmer celebration days.", icon: "fa-umbrella-beach", href: "/holiday", label: "HOLIDAY" },
  { id: "promo", title: "Promotions & Grants", desc: "Current subsidies, fertilizer discounts, and EU funding opportunities for Ethiopian farmers.", icon: "fa-bullhorn", href: "/promo", label: "PROMO" },
  { id: "bsc", title: "BSC-Desk", desc: "Balanced Scorecard dashboard for regional agricultural performance metrics.", icon: "fa-stamp", href: "/bsc", label: "BSC-DESK" },
  { id: "letter", title: "Expert Directory", desc: "Connect with agronomists, vets, and crop specialists across Ethiopia.", icon: "fa-file-signature", href: "/letter", label: "LETTER" },
  { id: "kpis", title: "KPIs", desc: "Real-time key performance indicators for yield, irrigation, and soil health.", icon: "fa-chart-pie", href: "/kpis", label: "KPIS" },
  { id: "minutes", title: "Meeting Minutes", desc: "Archive of MOA board meetings and regional agricultural councils.", icon: "fa-users-rectangle", href: "/minutes", label: "MINUTES" },
  { id: "reports", title: "Reports", desc: "Downloadable annual reports, crop forecasts, and sustainability audits.", icon: "fa-file-contract", href: "/reports", label: "REPORTS" },
  { id: "survey", title: "Farmer Survey", desc: "Participate in national surveys to shape agricultural policy.", icon: "fa-clipboard-question", href: "/survey", label: "SURVEY" },
  { id: "todo", title: "Todo / Tasks", desc: "Personal task manager for extension agents and farm managers.", icon: "fa-list-check", href: "/todo", label: "TODO" },
];

interface MegaMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MegaMenuModal({ isOpen, onClose }: MegaMenuModalProps) {
  const [mounted, setMounted] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    setMounted(true);
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div 
      className={`fixed inset-0 flex justify-center items-center z-[2000] bg-[var(--modal-overlay)] backdrop-blur-[8px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`bg-[var(--card-bg)] w-[95%] max-w-[1100px] h-[85vh] rounded-[32px] flex flex-col md:flex-row overflow-hidden relative shadow-[var(--shadow-lg)] transition-transform duration-300 border border-[var(--border-color)] ${isOpen ? 'scale-100' : 'scale-95'}`}>
        <div 
          className="absolute top-[25px] right-[25px] cursor-pointer bg-[var(--bg-secondary)] text-[var(--text-main)] w-10 h-10 flex items-center justify-center rounded-full text-[1.2rem] z-10 transition-colors hover:bg-[#ef4444] hover:text-white"
          onClick={onClose}
        >
          <i className="fa-solid fa-xmark"></i>
        </div>

        <div className="flex-[1.6] p-10 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-5 overflow-y-auto bg-[var(--bg-main)]">
          {menuItems.map((item) => (
            <div 
              key={item.id}
              className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[20px] transition-all duration-250 cursor-pointer hover:border-[var(--primary-green)] hover:translate-y-[-5px] hover:shadow-[var(--shadow-sm)]"
              onMouseEnter={() => setHoveredItem(item)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => onClose()}
            >
              <Link href={item.href} className="no-underline flex flex-col items-center gap-3 p-[20px_15px] w-full h-full text-inherit">
                <i className={`fa-solid ${item.icon} text-[2rem] text-[var(--primary-green)]`}></i>
                <span className="text-[0.75rem] font-bold uppercase text-[var(--text-main)] text-center">{item.label}</span>
              </Link>
            </div>
          ))}
        </div>

        <div className="flex-1 p-[50px_40px] bg-[var(--bg-secondary)] flex flex-col gap-[25px] border-l md:border-l border-t md:border-t-0 border-[var(--border-color)] overflow-y-auto">
          <div className="text-[var(--primary-green)] font-extrabold text-[1.2rem] uppercase tracking-[1px]">Digital Hub</div>
          <h3 className="text-[2rem] text-[var(--text-main)] leading-[1.2] font-bold">
            Let&apos;s make it <br /><span className="text-[var(--primary-green)]">Sustainable.</span>
          </h3>
          <p className="text-[var(--text-muted)]">Select a module from the grid to access advanced tools &amp; real-time agricultural insights.</p>
          
          <div className="border border-[var(--border-color)] p-[25px] rounded-[24px] bg-[var(--card-bg)] shadow-[var(--shadow-sm)] min-h-[140px]">
            {hoveredItem ? (
              <>
                <p className="text-[1.1rem] font-bold text-[var(--primary-green)] mb-2">{hoveredItem.title}</p>
                <p className="text-[0.9rem] text-[var(--text-muted)] leading-[1.5]">{hoveredItem.desc}</p>
              </>
            ) : (
              <>
                <p className="text-[1.1rem] font-bold text-[var(--text-main)]">Module Information</p>
                <p className="text-[0.85rem] text-[var(--text-muted)] mt-1">Hover over any card to see details or click to open the full module.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

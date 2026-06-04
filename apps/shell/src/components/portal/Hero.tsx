"use client";

import { useState } from "react";

export function Hero() {
  const [resourceType, setResourceType] = useState("");
  const [region, setRegion] = useState("");

  const handleExplore = () => {
    const infoSection = document.getElementById("info-section");
    infoSection?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSearch = () => {
    alert(`🔍 MOA Search: ${resourceType || 'All resources'} in ${region || 'All regions'} — Results will appear in the dashboard soon.`);
    // TODO: Connect to /api/search
  };

  return (
    <header className="px-[5%] py-[30px]">
      <div className="relative h-[600px] rounded-[32px] overflow-visible flex items-center px-[8%] shadow-[var(--shadow-lg)] bg-[linear-gradient(to_right,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.3)_100%),url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=2000')] bg-no-repeat bg-center bg-cover">
        <div className="text-white max-w-[650px] z-[2] animate-up">
          <h1 className="text-[3rem] md:text-[4rem] leading-[1.1] mb-5 font-extrabold tracking-[-1px]">
            Sustainable Farming for Tomorrow
          </h1>
          <p className="text-[1.15rem] mb-[35px] opacity-90 font-normal">
            Empowering Ethiopian farmers with cutting-edge digital tools to enhance productivity, track yields, and ensure environmental harmony.
          </p>
          <button 
            className="px-9 py-4 bg-[var(--primary-green)] text-white border-none rounded-[100px] cursor-pointer font-semibold text-[1rem] shadow-[0_10px_20px_rgba(26,117,84,0.3)] transition-all hover:bg-[var(--primary-hover)] hover:translate-y-[-2px] hover:shadow-[0_15px_25px_rgba(26,117,84,0.4)]"
            onClick={handleExplore}
          >
            Explore Platform
          </button>
        </div>

        <div className="absolute bottom-[-120px] md:bottom-[-40px] left-1/2 md:left-[10%] translate-x-[-50%] md:translate-x-0 bg-[var(--card-bg)] w-[90%] md:w-[85%] max-w-[900px] p-[20px] md:p-[15px_25px] rounded-[24px] md:rounded-[100px] shadow-[var(--shadow-lg)] flex flex-col md:flex-row justify-between items-center gap-[15px] border border-[var(--border-color)] z-10 animate-up [animation-delay:0.2s]">
          <div className="flex-1 px-[15px] w-full border-b md:border-b-0 md:border-r border-[var(--border-color)] pb-[10px] md:pb-0">
            <label className="block text-[0.75rem] font-semibold text-[var(--text-muted)] mb-1 uppercase">Resource Type</label>
            <input 
              type="text" 
              placeholder="e.g., Fertilizer, Seeds..." 
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              className="border-none outline-none w-full font-semibold text-[1rem] bg-transparent text-[var(--text-main)] placeholder:text-[var(--text-muted)] placeholder:font-normal"
            />
          </div>
          <div className="flex-1 px-[15px] w-full pb-[10px] md:pb-0">
            <label className="block text-[0.75rem] font-semibold text-[var(--text-muted)] mb-1 uppercase">Region</label>
            <input 
              type="text" 
              placeholder="e.g., Addis Ababa, Oromia..." 
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="border-none outline-none w-full font-semibold text-[1rem] bg-transparent text-[var(--text-main)] placeholder:text-[var(--text-muted)] placeholder:font-normal"
            />
          </div>
          <button 
            className="w-full md:w-auto px-10 py-[14px] bg-[var(--primary-green)] text-white border-none rounded-[100px] cursor-pointer font-semibold text-[1rem] shadow-none transition-all hover:bg-[var(--primary-hover)] hover:translate-y-[-2px]"
            onClick={handleSearch}
          >
            Search
          </button>
        </div>
      </div>
    </header>
  );
}

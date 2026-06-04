"use client";

import { useEffect, useRef } from "react";

interface SectorCard {
  title: string;
  description: string;
  imageSrc: string;
  buttonText: string;
  onClick?: () => void;
}

interface CardGridProps {
  title: string;
  cards: SectorCard[];
}

export function CardGrid({ title, cards }: CardGridProps) {
  const headerRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("scroll-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    if (headerRef.current) observer.observe(headerRef.current);
    
    const cardElements = document.querySelectorAll('.sector-card');
    cardElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="px-[8%] py-20 bg-[var(--bg-secondary)] text-center">
      <h2 ref={headerRef} className="text-[2.5rem] font-extrabold mb-[50px] text-[var(--text-main)] scroll-hidden">
        {title}
      </h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-10">
        {cards.map((card, index) => (
          <div 
            key={index} 
            className="sector-card bg-[var(--card-bg)] p-5 rounded-[24px] border border-[var(--border-color)] shadow-[var(--shadow-md)] text-left transition-all duration-400 hover:translate-y-[-12px] hover:shadow-[var(--shadow-lg)] hover:border-[var(--primary-green)] group scroll-hidden"
          >
            <img 
              src={card.imageSrc} 
              alt={card.title} 
              className="w-full h-[240px] object-cover rounded-[16px] mb-5"
            />
            <h3 className="text-[1.4rem] mb-3 text-[var(--text-main)] font-bold">{card.title}</h3>
            <p className="text-[var(--text-muted)] mb-5 text-[0.95rem]">{card.description}</p>
            <button 
              className="px-6 py-3 bg-transparent border-2 border-[var(--border-color)] text-[var(--text-main)] rounded-[100px] cursor-pointer font-semibold transition-all group-hover:bg-[var(--primary-green)] group-hover:border-[var(--primary-green)] group-hover:text-white"
              onClick={card.onClick || (() => alert('Opening dashboard...'))}
            >
              {card.buttonText}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

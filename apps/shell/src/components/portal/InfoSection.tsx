"use client";

import { useEffect, useRef } from "react";

interface InfoSectionProps {
  id?: string;
  title: string;
  description: string;
  imageSrc: string;
  buttonText: string;
  onButtonClick?: () => void;
  reverse?: boolean;
}

export function InfoSection({ 
  id, 
  title, 
  description, 
  imageSrc, 
  buttonText, 
  onButtonClick,
  reverse = false 
}: InfoSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

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

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleDefaultClick = () => {
    alert('More about MOA Digital coming soon!');
  };

  return (
    <section 
      id={id} 
      ref={sectionRef}
      className={`mt-[150px] md:mt-[100px] px-[8%] py-20 flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-[60px] scroll-hidden`}
    >
      <div className="flex-1 relative w-full">
        <img 
          src={imageSrc} 
          alt={title} 
          className="w-full rounded-[32px] shadow-[var(--shadow-lg)] transition-transform duration-300 hover:scale-[1.02]"
        />
      </div>
      <div className="flex-1 text-center md:text-left">
        <h2 className="text-[2.5rem] md:text-[2.8rem] text-[var(--text-main)] mb-5 leading-[1.2] font-extrabold">
          {title.split(' ').map((word, i) => (
            <span key={i} className={word.toLowerCase() === 'technology' || word.toLowerCase() === 'sustainable.' ? 'text-[var(--primary-green)]' : ''}>
              {word}{' '}
            </span>
          ))}
        </h2>
        <p className="text-[var(--text-muted)] text-[1.1rem] mb-[30px]">
          {description}
        </p>
        <button 
          className="px-9 py-4 bg-[var(--primary-green)] text-white border-none rounded-[100px] cursor-pointer font-semibold text-[1rem] shadow-[0_10px_20px_rgba(26,117,84,0.3)] transition-all hover:bg-[var(--primary-hover)] hover:translate-y-[-2px]"
          onClick={onButtonClick || handleDefaultClick}
        >
          {buttonText}
        </button>
      </div>
    </section>
  );
}

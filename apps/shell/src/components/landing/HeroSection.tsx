"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Award, BookOpen, Users, UserPlus } from "lucide-react";

const HERO_CONTENT = [
  {
    src: "/assets/images/hero-img.jpg",
    alt: "Addisu Arega",
    name: "Addisu Arega",
    role: "Minister of Agriculture",
    avatarSrc: null,
    videoUrl: "https://youtu.be/GVI0v1SIsn8?si=XZRSLYcf5lvQHiNO",
  },
  {
    src: "/assets/images/avatar/stateMinisters1.png",
    alt: "State Minister 1",
    name: "Meles Mekonnen(Ph.D.),",
    role: "State Minister",
    avatarSrc: "/assets/images/avatar/stateMinisters1.png",
    videoUrl: null,
  },
  {
    src: "/assets/images/avatar/stateMinisters2.png",
    alt: "State Minister 2",
    name: "Prof. Eyasu Elias",
    role: "State Minister",
    avatarSrc: "/assets/images/avatar/stateMinisters2.png",
    videoUrl: null,
  },
  {
    src: "/assets/images/avatar/stateMinisters3.png",
    alt: "State Minister 3",
    name: "Fikru Regassa(Ph.D.)",
    role: "State Minister",
    avatarSrc: "/assets/images/avatar/stateMinisters3.png",
    videoUrl: "https://youtu.be/86qzJ0Kt_BA?si=nC8UTMCAwG0KrLOk",
  },
  {
    src: "/assets/images/avatar/stateMinisters4.png",
    alt: "State Minister 4",
    name: "Sofia Kassa(Ph.D.)",
    role: "State Minister",
    avatarSrc: "/assets/images/avatar/stateMinisters4.png",
    videoUrl: "https://youtu.be/qm7Ey_iTsJk?si=He8jGprBD9yyUqlQ",
  },
];

export function HeroSection() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((i) => (i + 1) % HERO_CONTENT.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const activeContent = HERO_CONTENT[activeIdx];

  return (
    <section className="relative overflow-hidden bg-white py-16 lg:py-24" id="hero">
      {/* decorative circle */}
      <div
        className="pointer-events-none absolute -right-40 -top-40 hidden h-[560px] w-[560px] rounded-full bg-[#1A7554]/5 lg:block"
        aria-hidden="true"
      />
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-2">
        {/* Left */}
        <div className="z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#1A7554]/30 bg-[#1A7554]/10 px-4 py-2 text-sm font-medium text-[#1A7554]">
            <span className="h-2 w-2 rounded-full bg-[#1A7554]" />
            MoA leads the way
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-gray-900 lg:text-5xl">
            Empowering agriculture{" "}
            <span className="text-[#1A7554]">through digital innovation,</span>{" "}
            MoA leads the way.
          </h1>
          <p className="mt-6 text-base leading-relaxed text-gray-500">
            Join the network driving Ethiopian agricultural investment. Access valuable data, insights,
            and enhanced communication tools to grow your business and services.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-[#1A7554] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#154735] active:scale-[0.98]"
            >
              Sign In <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#DCE5E0] bg-transparent px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-[#1A7554] hover:bg-[#1A7554] hover:text-white"
            >
              <UserPlus className="h-4 w-4" style={{ stroke: "currentColor" }} />
              Sign Up
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-8">
            {[
              { icon: <Users className="h-5 w-5 text-[#1A7554]" />, label: "5K+ user" },
              { icon: <BookOpen className="h-5 w-5 text-[#1A7554]" />, label: "2000+ Active Users" },
              { icon: <Award className="h-5 w-5 text-[#1A7554]" />, label: "4.9 Rating" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-gray-500">
                {icon}
                <span className="font-semibold text-gray-900">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — image card */}
        <div className="rounded-3xl border border-[#DCE5E0] bg-white p-3 shadow-md z-10">
          <div className="relative">
            {/* Image container (with overflow-hidden so the images don't spill, but badge container is OUTSIDE this) */}
            <div className="relative overflow-hidden rounded-[20px]" style={{ height: 420 }}>
              {HERO_CONTENT.map((content, idx) => (
                <Image
                  key={idx}
                  src={content.src}
                  alt={content.alt}
                  fill
                  priority={idx === 0}
                  className={`object-cover transition-all duration-1000 ease-in-out ${
                    idx === activeIdx ? "opacity-100 scale-100" : "opacity-0 scale-105"
                  }`}
                />
              ))}

              {/* Play button overlay */}
              {activeContent.videoUrl && (
                <a
                  href={activeContent.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-full bg-[#1A7554] text-white shadow-lg transition hover:scale-110 z-10"
                  aria-label="Play video"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4v16a1 1 0 0 0 1.524.852l13-8a1 1 0 0 0 0-1.704l-13-8A1 1 0 0 0 6 4z" />
                  </svg>
                </a>
              )}
            </div>

            {/* Avatar group — top right (OUTSIDE overflow-hidden) */}
            <div className="absolute -right-4 -top-5 z-20">
              <div className="flex items-center gap-2 rounded-full border border-[#DCE5E0] bg-white px-3 py-2 shadow-md">
                <div className="flex -space-x-3">
                  {HERO_CONTENT.slice(1).map((m, i) => {
                    const mappedIdx = i + 1;
                    return (
                      <button
                        key={i}
                        onClick={() => setActiveIdx(mappedIdx)}
                        className={`relative h-10 w-10 rounded-full border-2 bg-white transition-all hover:scale-110 hover:z-10 focus:outline-none ${
                          activeIdx === mappedIdx ? "border-[#1A7554] ring-2 ring-[#1A7554] z-10" : "border-white"
                        }`}
                        title={m.alt}
                        aria-label={`View ${m.alt}`}
                      >
                        <Image src={m.avatarSrc!} alt={m.alt} fill className="rounded-full object-cover" />
                      </button>
                    );
                  })}
                </div>
                <span className="ml-1 pr-2 text-sm font-bold text-[#154735]">MOA</span>
              </div>
            </div>

            {/* Minister badge — bottom left (OUTSIDE overflow-hidden) */}
            <div className="absolute -bottom-5 -left-4 z-20">
              <div className="flex items-center gap-3 rounded-full border border-[#DCE5E0] bg-white px-4 py-2 shadow-md transition-all duration-500">
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-[#DCE5E0]">
                  <Image
                    src="/assets/images/favicon_io/favicon.png"
                    alt="MOA"
                    fill
                    className="object-contain p-0.5"
                  />
                </div>
                <div className="flex flex-col leading-tight pr-2">
                  <span className="text-sm font-bold text-gray-900 transition-opacity duration-300">
                    {activeContent.name}
                  </span>
                  <span className="text-[11px] text-gray-500 transition-opacity duration-300">
                    {activeContent.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import { Star } from "lucide-react";

const PARTNERS = [
  {
    img: "/assets/images/avatar/ecc_logo.png",
    name: "ECC",
    title: "Ethiopian Communication Commission",
    rating: "4.9",
  },
  {
    img: "/assets/images/avatar/DBE.jpg",
    name: "DBOE",
    title: "Development Bank of Ethiopia",
    rating: "4.8",
  },
  {
    img: "/assets/images/avatar/agricultur lead.jpg",
    name: "EAA",
    title: "Ethiopian Agricultural Authority",
    rating: "4.9",
  },
  {
    img: "/assets/images/avatar/MoF mof.png",
    name: "MoF",
    title: "Ministry of Finance",
    rating: "4.8",
  },
];

function SocialBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DCE5E0] bg-white text-gray-500 transition hover:border-[#1A7554] hover:text-[#1A7554]">
      {children}
    </button>
  );
}

export function PartnersSection() {
  return (
    <section id="partners" className="bg-gray-50/30 py-20 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.125rem] text-[#1A7554]">Partners</span>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            Future systems are <span className="text-[#1A7554]">underway...</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-gray-500">
            Effective collaboration paves the way for transformative solutions, ensuring agricultural investments yield maximum impact.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PARTNERS.map((p) => (
            <div
              key={p.name}
              className="flex flex-col items-center rounded-[20px] border border-[#DCE5E0] bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative mb-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-yellow-400">
                  <Image src={p.img} alt={p.name} fill className="object-cover" />
                </div>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {p.rating} <Star className="h-2.5 w-2.5 fill-white text-white" />
                </span>
              </div>
              <h3 className="mt-2 text-sm font-bold text-gray-900">{p.name}</h3>
              <span className="mt-1 block text-xs text-gray-500">{p.title}</span>
              <div className="mt-4 flex items-center justify-center gap-2">
                <SocialBtn>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733-16z"/><path d="M4 20l6.768-6.768m2.46-2.46l6.772-6.772"/></svg>
                </SocialBtn>
                <SocialBtn>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 11v5"/><path d="M8 8v.01"/><path d="M12 16v-5"/><path d="M16 16v-3a2 2 0 1 0-4 0"/><path d="M3 7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/></svg>
                </SocialBtn>
                <SocialBtn>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0c-2.4-1.6-3.5-1.3-3.5-1.3a4.2 4.2 0 0 0-.1 3.2 4.6 4.6 0 0 0-1.3 3.2c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2v3.5"/></svg>
                </SocialBtn>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

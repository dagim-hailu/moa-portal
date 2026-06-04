import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

const FOOTER_COLS = [
  {
    heading: "Product",
    links: ["Features", "Pricing", "Systems", "Community"],
  },
  {
    heading: "Company",
    links: ["About Us", "Careers", "Blog", "Press"],
  },
  {
    heading: "Support",
    links: ["Help Center", "Contact Us", "Privacy Policy", "Terms of Service"],
  },
  {
    heading: "Help Center",
    links: ["Web Development", "UI/UX Design", "Data Science", "Marketing"],
  },
];

function SocialBtn({ children }: { children: React.ReactNode }) {
  return (
    <a
      href="#"
      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DCE5E0] bg-white text-gray-500 transition hover:border-[#1A7554] hover:text-[#1A7554]"
    >
      {children}
    </a>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-gray-50 pt-16 pb-8">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          {/* Brand col */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/assets/images/favicon_io/favicon-32x32.png"
                alt="MOA"
                width={36}
                height={36}
                className="rounded-md"
              />
              <span className="font-bold text-gray-900">Ministry of Agriculture</span>
            </Link>
            <p className="mt-4 text-sm text-gray-500 leading-relaxed">
              Empowering millions of learners worldwide with industry-leading courses and expert mentors.
            </p>
            <div className="mt-5 flex flex-col gap-2 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#1A7554]" />
                hello@moa.gov.et
              </span>
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#1A7554]" />
                +251 11 123 4567
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#1A7554]" />
                Addis Ababa, Ethiopia
              </span>
            </div>
          </div>

          {/* Link cols */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER_COLS.map((col) => (
              <div key={col.heading}>
                <h4 className="mb-4 text-sm font-semibold text-gray-900">{col.heading}</h4>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-gray-500 transition hover:text-[#1A7554]">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[#DCE5E0] pt-6 sm:flex-row">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Ministry of Agriculture. All rights reserved. Developed by{" "}
            <a href="https://kukunetdigital.com/" target="_blank" rel="noopener noreferrer" className="text-[#1A7554] hover:underline">
              Kukunet Digital
            </a>{" "}
            • Designed by{" "}
            <a href="https://kukunetdigital.com/" target="_blank" rel="noopener noreferrer" className="text-[#1A7554] hover:underline">
              YonasA
            </a>
          </p>
          <div className="flex gap-2">
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
      </div>
    </footer>
  );
}

import Image from "next/image";
import { PublicNav } from "../../components/PublicNav";
import { PublicFooter } from "../../components/landing/PublicFooter";
import { getSession } from "../../lib/session";

export default async function AboutPage() {
  const session = await getSession();

  const content = (
    <section className="mx-auto max-w-[1280px] px-6 py-16 md:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.125rem] text-[#1A7554]">About Us</span>
          <h1 className="mt-4 text-4xl font-extrabold text-gray-900">
            About the{" "}
            <span className="text-[#1A7554]">Ministry of Agriculture</span>
          </h1>
          <p className="mt-6 text-base leading-relaxed text-gray-500">
            The Ministry of Agriculture leads Ethiopia&apos;s agricultural transformation through policy, extension
            services, and digital innovation. MOA Digital unifies staff tools in one secure portal.
          </p>
          <p className="mt-4 text-base leading-relaxed text-gray-500 amharic">
            የግብርና ሚኒስቴር በፖሊሲ፣ በማስረጃ አገልግሎት እና በዲጂታል አዳዲስ መንገዶች የኢትዮጵያን የግብርና ለውጥ ይመራል።
          </p>

          <div className="mt-8 grid grid-cols-3 gap-6">
            {[
              { num: "5K+", label: "Registered Users" },
              { num: "12+", label: "Digital Systems" },
              { num: "4.9", label: "Average Rating" },
            ].map(({ num, label }) => (
              <div key={label} className="rounded-xl border border-[#DCE5E0] bg-white p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-[#1A7554]">{num}</p>
                <p className="mt-1 text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <Image
            src="/assets/images/hero-img.jpg"
            alt="Ministry of Agriculture"
            width={560}
            height={420}
            className="w-full rounded-[24px] object-cover shadow-lg"
          />
          <div className="absolute -bottom-4 -left-4 rounded-[16px] border border-[#DCE5E0] bg-white p-4 shadow-md">
            <p className="text-xs text-gray-500">Minister of Agriculture</p>
            <p className="text-sm font-bold text-gray-900">Addisu Arega</p>
          </div>
        </div>
      </div>
    </section>
  );

  if (session) {
    return content;
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      {content}
      <PublicFooter />
    </div>
  );
}

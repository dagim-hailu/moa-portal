import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Star, Users } from "lucide-react";

const CARDS = [
  {
    img: "/assets/images/course-img-1.jpg",
    badge: "Large Scale",
    badgeCls: "bg-yellow-400 text-yellow-900",
    title: "Large Scale Agricultural Investment Information System",
    weeks: "12 weeks", users: "2.4K", rating: "4.9",
  },
  {
    img: "/assets/images/course-img-2.jpg",
    badge: "Livestock",
    badgeCls: "bg-red-500 text-white",
    title: "Livestock Investment Information Management System",
    weeks: "8 weeks", users: "1.8K", rating: "4.8",
  },
  {
    img: "/assets/images/event.webp",
    badge: "Event Management",
    badgeCls: "bg-cyan-500 text-white",
    title: "Event Management System",
    weeks: "16 weeks", users: "3.2K", rating: "4.9",
  },
  {
    img: "/assets/images/dig_letters.jpeg",
    badge: "Letter Management",
    badgeCls: "bg-green-600 text-white",
    title: "Digital Letter Management System",
    weeks: "6 weeks", users: "1.5K", rating: "4.7",
  },
];

export function UpdatesSection() {
  return (
    <section id="updates" className="py-20 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.125rem] text-[#1A7554]">Updates</span>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            Empowering Digital <span className="text-[#1A7554]">Tools</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500">
            The Agricultural Investment and Input Supply Sub-Sector is committed to advancing digital solutions
            to improve efficiency, productivity, and customer satisfaction.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c) => (
            <article
              key={c.title}
              className="flex flex-col overflow-hidden rounded-[20px] border border-[#DCE5E0] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative h-44 overflow-hidden">
                <Image src={c.img} alt={c.title} fill className="object-cover" />
                <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${c.badgeCls}`}>
                  {c.badge}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-sm font-semibold leading-snug text-gray-900">{c.title}</h3>
                <div className="my-4 flex items-center gap-2 text-xs text-gray-500">
                  <Image src="/assets/images/kukunets.png" alt="kukunet" width={20} height={20} className="rounded-full" />
                  kukunet digital
                </div>
                <div className="mb-3 flex items-center justify-between border-b border-[#DCE5E0] pb-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{c.weeks}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.users}</span>
                  <span className="flex items-center gap-1 text-yellow-500"><Star className="h-3 w-3 fill-current" />{c.rating}</span>
                </div>
                <Link href="/login" className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-[#1A7554] hover:underline">
                  Enroll now <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-800 px-6 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-800 hover:text-white"
          >
            View All Systems <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

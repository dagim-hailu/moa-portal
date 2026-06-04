import Image from "next/image";
import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    text: "Ministry of Agriculture completely transformed my career. The web development bootcamp gave me the skills I needed to land my dream job at Meta. The mentors are incredible!",
    name: "Alex Thompson", role: "Software Developer at Meta", img: "/assets/images/avatar/avatar-1.jpg",
  },
  {
    text: "The UI/UX design course was exactly what I needed. The practical projects and mentor feedback helped me build a portfolio that got me hired at Spotify.",
    name: "Jessica Lee", role: "UX Designer at Spotify", img: "/assets/images/avatar/avatar-2.jpg",
  },
  {
    text: "I switched careers from marketing to data science thanks to Ministry of Agriculture. The structured curriculum and supportive community made the transition seamless.",
    name: "David Park", role: "Data Analyst at Amazon", img: "/assets/images/avatar/avatar-3.jpg",
  },
  {
    text: "As a freelancer, I needed flexible learning. Ministry of Agriculture's self-paced courses fit perfectly into my schedule. Highly recommend!",
    name: "Maria Garcia", role: "Freelance Designer", img: "/assets/images/avatar/avatar-5.jpg",
  },
  {
    text: "The marketing course helped me understand how to grow my startup. The ROI has been incredible - best investment in my education.",
    name: "James Wilson", role: "Startup Founder", img: "/assets/images/avatar/avatar-6.jpg",
  },
  {
    text: "The combination of technical and business courses gave me a unique edge. I've recommended Ministry of Agriculture to all my colleagues.",
    name: "Emily Chen", role: "Product Manager at Google", img: "/assets/images/avatar/avatar-3.jpg",
  },
];

function Stars() {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-gray-50/50 py-20 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.125rem] text-[#1A7554]">Testimonials</span>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            What Our <span className="text-gray-900">Students</span> Say
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-gray-500">
            Join thousands of successful students who have transformed their careers with Ministry of Agriculture.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="flex flex-col rounded-[20px] border border-[#DCE5E0] bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <Stars />
              <Quote className="mt-4 h-6 w-6 text-[#1A7554]" />
              <p className="mt-3 flex-1 text-sm font-semibold leading-relaxed text-gray-800">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-[#DCE5E0] pt-5">
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
                  <Image src={t.img} alt={t.name} fill className="object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

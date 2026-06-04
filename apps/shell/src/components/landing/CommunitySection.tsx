import Link from "next/link";
import { Users, MessageCircle, CalendarCheck, Bell, Globe, HeartHandshake } from "lucide-react";

const FEATURES = [
  { icon: <Users className="h-5 w-5" />, title: "Study Groups", desc: "Connect with like-minded learners and form study groups for collaborative learning." },
  { icon: <MessageCircle className="h-5 w-5" />, title: "Discussion Forums", desc: "Engage in meaningful discussions and get answers from peers and mentors." },
  { icon: <CalendarCheck className="h-5 w-5" />, title: "Live Sessions", desc: "Join live Q&A sessions and workshops with industry experts." },
  { icon: <Bell className="h-5 w-5" />, title: "Peer Support", desc: "Get help and support from fellow learners anytime you need it." },
  { icon: <Globe className="h-5 w-5" />, title: "Global Community", desc: "Connect with students from 150+ countries worldwide." },
  { icon: <HeartHandshake className="h-5 w-5" />, title: "Project Collaboration", desc: "Work on real-world projects with your peers." },
];

export function CommunitySection() {
  return (
    <section id="community" className="relative overflow-hidden py-20 lg:py-24">
      <div
        className="pointer-events-none absolute -left-40 -top-40 hidden h-[480px] w-[480px] rounded-full bg-[#1A7554]/5 lg:block"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.125rem] text-[#1A7554]">Community</span>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">
              Join Our Kukunet <span className="text-[#1A7554]">Supporter Team</span>
            </h2>
            <p className="mt-4 text-base text-gray-500">
              Learning is better together. Join our community of 50,000+ members and unlock collaborative features
              that accelerate your growth.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {FEATURES.map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1A7554]/10 text-[#1A7554]">
                    {icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
                    <p className="mt-1 text-xs text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-[#1A7554] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#154735]"
              >
                Join Community
              </Link>
            </div>
          </div>

          {/* Floating 24/7 support card */}
          <div className="flex items-center justify-center">
            <div className="relative flex w-full max-w-sm flex-col items-center justify-center rounded-[24px] border border-[#DCE5E0] bg-white p-10 shadow-md">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1A7554]/10 text-[#1A7554]">
                <MessageCircle className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">24/7 Support</h3>
              <p className="mt-2 text-sm text-gray-500">Always here for you</p>
              <div className="mt-6 flex gap-3 text-xs text-gray-400">
                <span className="rounded-full bg-gray-100 px-3 py-1">Live Chat</span>
                <span className="rounded-full bg-gray-100 px-3 py-1">Email</span>
                <span className="rounded-full bg-gray-100 px-3 py-1">Phone</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

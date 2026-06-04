"use client";

import { FormEvent, useState } from "react";
import { Headphones, Mail, Phone, MapPin } from "lucide-react";
import { PublicNav } from "../../components/PublicNav";
import { PublicFooter } from "../../components/landing/PublicFooter";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        message: formData.get("message"),
      }),
    });
    setStatus(response.ok ? "ok" : "error");
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <section className="mx-auto max-w-[1280px] px-6 py-16 md:py-24">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.125rem] text-[#1A7554]">Contact</span>
          <h1 className="mt-4 text-4xl font-extrabold text-gray-900">
            Get in <span className="text-[#1A7554]">Touch</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-gray-500">
            Have questions about subsidies or modern farming techniques? Our digital desk is here to help.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-start">
          {/* Form */}
          <div className="rounded-[20px] border border-[#DCE5E0] bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-xl font-bold text-gray-900">Send us a message</h2>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  name="fullName"
                  required
                  placeholder="Jane Doe"
                  className="w-full rounded-lg border border-[#DCE5E0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1A7554] focus:ring-2 focus:ring-[#1A7554]/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full rounded-lg border border-[#DCE5E0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1A7554] focus:ring-2 focus:ring-[#1A7554]/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Message</label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  placeholder="Your Message"
                  className="w-full rounded-lg border border-[#DCE5E0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1A7554] focus:ring-2 focus:ring-[#1A7554]/20"
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-full bg-[#1A7554] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#154735] active:scale-[0.98] disabled:opacity-60"
              >
                {status === "loading" ? "Sending..." : "Send Message"}
              </button>
              {status === "ok" && <p className="text-sm text-[#1A7554]">Message sent successfully!</p>}
              {status === "error" && <p className="text-sm text-red-500">Could not send. Please try again.</p>}
            </form>
          </div>

          {/* Info cards */}
          <div className="flex flex-col gap-6">
            <div className="rounded-[20px] border border-[#DCE5E0] bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1A7554]/10 text-[#1A7554]">
                <Headphones className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-gray-900">Direct Support</h3>
              <p className="mt-2 text-sm text-gray-500">Our team is available Sunday–Thursday, 8am–5pm EAT.</p>
            </div>

            {[
              { icon: <Mail className="h-5 w-5" />, label: "Email", value: "support@moa.gov.et" },
              { icon: <Phone className="h-5 w-5" />, label: "Phone", value: "+251 11 123 4567" },
              { icon: <MapPin className="h-5 w-5" />, label: "Address", value: "Addis Ababa, Ethiopia" },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 rounded-[16px] border border-[#DCE5E0] bg-white p-5 shadow-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1A7554]/10 text-[#1A7554]">
                  {icon}
                </div>
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-bold text-gray-900">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

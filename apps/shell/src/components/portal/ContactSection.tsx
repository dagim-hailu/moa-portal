"use client";

import { useState } from "react";

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Message sent from ${formData.name}! We will get back to you at ${formData.email}.`);
    setFormData({ name: "", email: "", message: "" });
    // TODO: Connect to /api/contact
  };

  return (
    <section className="px-[8%] py-20 flex flex-col md:flex-row gap-[60px] items-start pt-[50px]">
      <div className="flex-1 w-full">
        <h2 className="text-[2rem] font-extrabold mb-5 text-[var(--text-main)]">
          Get in <span className="text-[var(--primary-green)]">Touch</span>
        </h2>
        <p className="text-[var(--text-muted)] mb-[30px]">
          Have questions about subsidies or modern farming techniques? Our digital desk is here to help.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-[15px]">
          <input 
            type="text" 
            placeholder="Full Name" 
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full p-[15px] rounded-[12px] border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] outline-none focus:border-[var(--primary-green)] transition-colors"
          />
          <input 
            type="email" 
            placeholder="Email Address" 
            required
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full p-[15px] rounded-[12px] border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] outline-none focus:border-[var(--primary-green)] transition-colors"
          />
          <textarea 
            placeholder="Your Message" 
            rows={4} 
            required
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            className="w-full p-[15px] rounded-[12px] border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] outline-none focus:border-[var(--primary-green)] transition-colors"
          ></textarea>
          <button 
            type="submit"
            className="px-9 py-4 bg-[var(--primary-green)] text-white border-none rounded-[100px] cursor-pointer font-semibold text-[1rem] shadow-[0_10px_20px_rgba(26,117,84,0.3)] transition-all hover:bg-[var(--primary-hover)] hover:translate-y-[-2px]"
          >
            Send Message
          </button>
        </form>
      </div>
      <div className="flex-1 w-full text-center">
        <div className="bg-[var(--bg-secondary)] p-10 rounded-[32px] border border-[var(--border-color)]">
          <i className="fa-solid fa-headset text-[4rem] text-[var(--primary-green)] mb-5"></i>
          <h3 className="text-[1.5rem] font-bold text-[var(--text-main)]">Direct Support</h3>
          <p className="my-[15px] text-[var(--text-muted)]">support@moa.gov.et</p>
          <p className="font-extrabold text-[1.2rem] text-[var(--text-main)]">+251 11 123 4567</p>
        </div>
      </div>
    </section>
  );
}

"use client";

export function Footer() {
  return (
    <footer className="bg-[var(--bg-main)] py-10 px-5 text-center border-t border-[var(--border-color)] mt-[50px]">
      <div className="max-w-[800px] mx-auto text-[var(--text-muted)] text-[0.95rem]">
        <p>© 2026 Ministry of Agriculture. All rights reserved.</p>
        <p className="text-[0.85rem] font-semibold tracking-[0.5px] mt-2">
          Powered by: <span className="text-[var(--primary-green)] font-extrabold">KUKUNET DIGITAL</span>
        </p>
      </div>
    </footer>
  );
}

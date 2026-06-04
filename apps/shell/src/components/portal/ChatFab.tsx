"use client";

import Link from "next/link";

export function ChatFab() {
  return (
    <div className="fixed bottom-5 right-5 md:bottom-[30px] md:right-[30px] w-[55px] h-[55px] md:w-[65px] md:h-[65px] bg-[#1A7554] text-white rounded-full flex items-center justify-center text-[1.5rem] md:text-[1.8rem] shadow-[0_10px_25px_rgba(26,117,84,0.4)] cursor-pointer z-[1000] transition-transform duration-300 hover:scale-110 hover:translate-y-[-5px] hover:bg-[#154735]">
      <Link href="/chat" className="text-white flex items-center gap-[5px] no-underline w-full h-full justify-center rounded-full">
        <i className="fa-solid fa-messages"></i>
        <i className="fa-solid fa-comment-dots ml-[-8px]"></i>
      </Link>
    </div>
  );
}

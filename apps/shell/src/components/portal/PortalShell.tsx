"use client";

import type { JwtPayload } from "@moa/shared/auth";
import type { MyApp } from "../../lib/portal-queries";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { MegaMenuModal } from "./MegaMenuModal";
import { ChatFab } from "./ChatFab";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Props = {
  session: JwtPayload;
  apps: MyApp[];
  locale?: "en" | "am";
  children: React.ReactNode;
};

export function PortalShell({ session, apps, locale, children }: Props) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isPortalAdmin = pathname?.startsWith("/admin");

  if (isPortalAdmin) {
    return <>{children}</>;
  }

  const userName = session.fullName ?? session.email.split("@")[0];

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <Navbar 
        userName={userName} 
        userEmail={session.email} 
        onOpenMenu={() => setIsMenuOpen(true)} 
      />
      <main>{children}</main>
      <Footer />
      <MegaMenuModal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      {pathname !== "/chat" && <ChatFab />}
    </div>
  );
}

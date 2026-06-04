import Link from "next/link";
import { LayoutDashboard, Settings, LogOut, FolderKanban, Shield, Leaf } from "lucide-react";
import { type JwtPayload } from "@moa/shared/auth";
import { getLocale, t } from "../lib/i18n";

const appIcons: Record<string, typeof FolderKanban> = {
  dms: FolderKanban,
};

type SidebarProps = {
  session: JwtPayload;
};

export function Sidebar({ session }: SidebarProps) {
  const locale = getLocale();
  
  const linkClasses = "flex items-center gap-3 border-l-4 border-transparent pl-5 pr-4 py-3 mr-4 rounded-r-full hover:bg-sidebar-hover aria-[current=page]:bg-sidebar-active aria-[current=page]:border-sidebar-foreground transition-colors";

  return (
    <aside className="flex h-screen w-64 flex-col justify-between bg-sidebar py-6 text-sidebar-foreground" role="navigation" aria-label="Application sidebar">
      <div>
        <div className="mb-8 px-6 flex items-center gap-3">
          <div className="flex items-center justify-center rounded bg-sidebar-active p-1.5 border border-[#2A9D90]/30">
            <Leaf className="h-6 w-6 text-[#DEEDE6]" />
          </div>
          <div>
            <h2 className="font-bold tracking-wide text-[#DEEDE6]">MOA Portal</h2>
            <p className="text-xs text-[#DEEDE6]/80 font-amharic">የግብርና ሚኒስቴር</p>
          </div>
        </div>

        <nav className="space-y-1 mt-4">
          <Link href="/" className={linkClasses} aria-current="page">
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-medium text-sm">{t(locale, "nav.dashboard")}</span>
          </Link>
          {session.apps.length === 0 ? (
            <p className="pl-6 py-2 text-sm text-sidebar-foreground/80">{t(locale, "sidebar.empty")}</p>
          ) : (
            session.apps.map((slug) => {
              const Icon = appIcons[slug] ?? FolderKanban;
              return (
                <Link key={slug} href={`/apps/${slug}`} className={linkClasses} aria-current={undefined}>
                  <Icon className="h-5 w-5" />
                  <span className="capitalize font-medium text-sm">{slug}</span>
                </Link>
              );
            })
          )}
          {session.roles.includes("admin") && (
            <Link href="/admin" className={linkClasses}>
              <Shield className="h-5 w-5" />
              <span className="font-medium text-sm">{t(locale, "admin.title")}</span>
            </Link>
          )}
        </nav>
      </div>
      
      <div className="space-y-1 mb-4">
        <Link href="/settings" className={linkClasses}>
          <Settings className="h-5 w-5" />
          <span className="font-medium text-sm">{t(locale, "nav.settings")}</span>
        </Link>
        <Link href="/api/auth/logout" className={linkClasses}>
          <LogOut className="h-5 w-5" />
          <span className="font-medium text-sm">{t(locale, "nav.signOut")}</span>
        </Link>
      </div>
    </aside>
  );
}

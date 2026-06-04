import Link from "next/link";
import { LayoutDashboard, Users, Grid, Settings, LogOut, Shield, Leaf } from "lucide-react";
import { getLocale, t } from "../lib/i18n";

export function AdminSidebar() {
  const locale = getLocale();
  
  const linkClasses = "flex items-center gap-3 border-l-4 border-transparent pl-5 pr-4 py-3 mr-4 rounded-r-full hover:bg-sidebar-hover aria-[current=page]:bg-sidebar-active aria-[current=page]:border-sidebar-foreground transition-colors";

  return (
    <aside className="flex h-screen w-64 flex-col justify-between bg-sidebar py-6 text-sidebar-foreground" role="navigation" aria-label="Admin sidebar">
      <div>
        <div className="mb-8 px-6 flex items-center gap-3">
          <div className="flex items-center justify-center rounded bg-sidebar-active p-1.5 border border-[#2A9D90]/30">
            <Leaf className="h-6 w-6 text-[#DEEDE6]" />
          </div>
          <div>
            <h2 className="font-bold tracking-wide text-[#DEEDE6]">Admin Console</h2>
            <p className="text-xs text-[#DEEDE6]/80 font-amharic">የግብርና ሚኒስቴር</p>
          </div>
        </div>

        <nav className="space-y-1 mt-4">
          <Link href="/admin" className={linkClasses}>
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-medium text-sm">Dashboard</span>
          </Link>
          
          <Link href="/admin/apps" className={linkClasses}>
            <Grid className="h-5 w-5" />
            <span className="font-medium text-sm">App Registry</span>
          </Link>
          
          <Link href="/admin/users" className={linkClasses}>
            <Users className="h-5 w-5" />
            <span className="font-medium text-sm">User Management</span>
          </Link>
        </nav>
      </div>
      
      <div className="space-y-1 mb-4">
        <Link href="/" className={linkClasses}>
          <Shield className="h-5 w-5" />
          <span className="font-medium text-sm">Exit Admin</span>
        </Link>
        <Link href="/api/auth/logout" className={linkClasses} prefetch={false}>
          <LogOut className="h-5 w-5" />
          <span className="font-medium text-sm">{t(locale, "nav.signOut")}</span>
        </Link>
      </div>
    </aside>
  );
}

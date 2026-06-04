import { ReactNode } from "react";
import { AdminSidebar } from "../../components/AdminSidebar";
import { Header } from "../../components/Header";
import { getSession } from "../../lib/session";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ChatFab } from "../../components/portal/ChatFab";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  
  if (!session || !session.roles.includes("admin")) {
    redirect("/login");
  }

  const localeCookie = cookies().get("moa_locale")?.value;
  const locale = localeCookie === "am" ? "am" : "en";

  const userName = session.fullName ?? session.email.split("@")[0];

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <Header userName={userName} locale={locale} />
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-8">
          {children}
        </main>
        <ChatFab />
      </div>
    </div>
  );
}

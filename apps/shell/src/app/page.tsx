import { redirect } from "next/navigation";
import { getSession } from "../lib/session";
import { fetchAnnouncements, fetchMyApps } from "../lib/portal-queries";
import { PublicLanding } from "../components/portal/PublicLanding";
import { PortalHome } from "../components/portal/PortalHome";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    return <PublicLanding />;
  }

  // If user is admin or supervisor, redirect to admin console
  if (session.roles.includes("admin") || session.roles.includes("supervisor")) {
    redirect("/admin");
  }

  const [apps, announcements] = await Promise.all([fetchMyApps(), fetchAnnouncements()]);
  const userName = session.fullName ?? session.email.split("@")[0];

  return <PortalHome apps={apps} announcements={announcements} userName={userName} />;
}

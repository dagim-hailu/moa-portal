import { getSession } from "../../lib/session";
import AuFreeTemplateWrapper from "../../au-free/next/AuFreeTemplateWrapper";
import Analytics from "pages/dashboard/Analytics";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  return (
    <AuFreeTemplateWrapper>
      <Analytics />
    </AuFreeTemplateWrapper>
  );
}

import { getSession } from "../../../lib/session";
import AuFreeTemplateWrapper from "../../../au-free/next/AuFreeTemplateWrapper";
import Account from "pages/others/Account";

export default async function AdminAccountPage() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  return (
    <AuFreeTemplateWrapper>
      <Account />
    </AuFreeTemplateWrapper>
  );
}

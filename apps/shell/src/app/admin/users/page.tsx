import { getSession } from "../../../lib/session";
import AuFreeTemplateWrapper from "../../../au-free/next/AuFreeTemplateWrapper";
import UserList from "pages/users/UserList";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  return (
    <AuFreeTemplateWrapper>
      <UserList />
    </AuFreeTemplateWrapper>
  );
}

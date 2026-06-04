import { runGraphql } from "../../../lib/graphql";
import { cookies } from "next/headers";
import AppRegistryClient from "./AppRegistryClient";
import { ACCESS_COOKIE_NAME } from "../../../lib/auth";
import AuFreeTemplateWrapper from "../../../au-free/next/AuFreeTemplateWrapper";

async function fetchApplications() {
  const token = cookies().get(ACCESS_COOKIE_NAME)?.value;
  if (!token) return [];

  const query = `
    query {
      applications {
        id
        slug
        nameEn
        nameAm
        descriptionEn
        descriptionAm
        routePath
        isActive
        searchEnabled
        assignedUsers
      }
    }
  `;

  try {
    const data = await runGraphql<any>(query, undefined, token);
    return data.applications || [];
  } catch (err) {
    return [];
  }
}

export default async function AppsPage() {
  const apps = await fetchApplications();

  return (
    <AuFreeTemplateWrapper>
      <AppRegistryClient initialApps={apps} />
    </AuFreeTemplateWrapper>
  );
}

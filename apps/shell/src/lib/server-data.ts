import { cookies } from "next/headers";
import { runGraphql } from "./graphql";
import { ACCESS_COOKIE_NAME } from "./auth";

export type PortalAnnouncement = {
  id: string;
  titleEn: string;
  titleAm: string;
  bodyEn: string;
  bodyAm: string;
};

export type PortalUserRecord = {
  id: string;
  email: string;
  fullName: string;
  role: string;
};

export async function getAuthToken() {
  return cookies().get(ACCESS_COOKIE_NAME)?.value;
}

export async function getPortalAnnouncements() {
  const query = `
    query {
      portalAnnouncements {
        id
        titleEn
        titleAm
        bodyEn
        bodyAm
      }
    }
  `;

  const data = await runGraphql<{ portalAnnouncements: PortalAnnouncement[] }>(query);
  return data.portalAnnouncements;
}

export async function getPortalUsers() {
  const token = await getAuthToken();
  if (!token) {
    return [];
  }

  const query = `
    query {
      portalUsers {
        id
        email
        fullName
        role
      }
    }
  `;

  const data = await runGraphql<{ portalUsers: PortalUserRecord[] }>(query, undefined, token);
  return data.portalUsers;
}

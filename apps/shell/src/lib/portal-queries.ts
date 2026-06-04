import { cookies } from "next/headers";
import { runGraphql } from "./graphql";
import { ACCESS_COOKIE_NAME } from "./auth";

export type MyApp = {
  id: string;
  slug: string;
  nameEn: string;
  nameAm: string;
  descriptionEn: string;
  descriptionAm: string;
  routePath: string;
  searchEnabled: boolean;
};

export type PortalAnnouncement = {
  id: string;
  titleEn: string;
  titleAm: string;
  bodyEn: string;
  bodyAm: string;
};

const MY_APPS_QUERY = `
  query MyApps {
    myApps {
      id
      slug
      nameEn
      nameAm
      descriptionEn
      descriptionAm
      routePath
      searchEnabled
    }
  }
`;

const ANNOUNCEMENTS_QUERY = `
  query PortalAnnouncements {
    portalAnnouncements {
      id
      titleEn
      titleAm
      bodyEn
      bodyAm
    }
  }
`;

export async function fetchMyApps(): Promise<MyApp[]> {
  const token = cookies().get(ACCESS_COOKIE_NAME)?.value;
  if (!token) return [];

  try {
    const data = await runGraphql<{ myApps: MyApp[] }>(MY_APPS_QUERY, undefined, token);
    return data.myApps;
  } catch {
    return [];
  }
}

export async function fetchAnnouncements(): Promise<PortalAnnouncement[]> {
  try {
    const data = await runGraphql<{ portalAnnouncements: PortalAnnouncement[] }>(ANNOUNCEMENTS_QUERY);
    return data.portalAnnouncements;
  } catch {
    return [];
  }
}

import { cookies } from "next/headers";
import { verifyPortalJwt, type JwtPayload } from "@moa/shared/auth";
import { ACCESS_COOKIE_NAME } from "./auth";

export async function getSession(): Promise<JwtPayload | null> {
  const token = cookies().get(ACCESS_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    return await verifyPortalJwt(token, process.env.JWT_SECRET ?? "replace_me");
  } catch {
    return null;
  }
}

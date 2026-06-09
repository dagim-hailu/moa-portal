import { NextRequest, NextResponse } from "next/server";
import { runGraphql } from "../../../../lib/graphql";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "../../../../lib/auth";

const LOGOUT_MUTATION = `
  mutation Logout($refreshToken: String!) {
    logout(refreshToken: $refreshToken)
  }
`;

async function doLogout(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (refreshToken) {
    await runGraphql(LOGOUT_MUTATION, { refreshToken }).catch(() => null);
  }
}

export async function GET(request: NextRequest) {
  await doLogout(request);
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.set(ACCESS_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  response.cookies.set("moa_locale", "", { path: "/", maxAge: 0 });
  return response;
}

export async function POST(request: NextRequest) {
  await doLogout(request);
  const response = NextResponse.json({ success: true });
  response.cookies.set(ACCESS_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  response.cookies.set("moa_locale", "", { path: "/", maxAge: 0 });
  return response;
}

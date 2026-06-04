import { NextRequest, NextResponse } from "next/server";
import { runGraphql } from "../../../../lib/graphql";
import {
  ACCESS_COOKIE_NAME,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from "../../../../lib/auth";

const REFRESH_MUTATION = `
  mutation Refresh($refreshToken: String!) {
    refresh(refreshToken: $refreshToken) {
      accessToken
      refreshToken
    }
  }
`;

function clearAndRedirect(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/login";
  const response = NextResponse.redirect(new URL(returnTo.startsWith("/") ? returnTo : "/login", request.url));
  response.cookies.set(ACCESS_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/";

  if (!refreshToken) {
    return clearAndRedirect(request);
  }

  try {
    const data = await runGraphql<{ refresh: { accessToken: string; refreshToken: string } }>(REFRESH_MUTATION, {
      refreshToken,
    });

    const response = NextResponse.redirect(new URL(returnTo.startsWith("/") ? returnTo : "/", request.url));
    response.cookies.set(ACCESS_COOKIE_NAME, data.refresh.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });
    response.cookies.set(REFRESH_COOKIE_NAME, data.refresh.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    });
    return response;
  } catch {
    return clearAndRedirect(request);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { runGraphql } from "../../../../lib/graphql";
import {
  ACCESS_COOKIE_NAME,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from "../../../../lib/auth";

const LOGIN_MUTATION = `
  mutation Login($identifier: String!, $password: String!) {
    login(identifier: $identifier, password: $password) {
      accessToken
      refreshToken
    }
  }
`;

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { identifier?: string; password?: string; locale?: "en" | "am" };
  const identifier = body.identifier?.trim().toLowerCase();
  const password = body.password?.trim();
  const locale = body.locale === "am" ? "am" : "en";

  if (!identifier || !password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  try {
    const data = await runGraphql<{ login: { accessToken: string; refreshToken: string } }>(LOGIN_MUTATION, {
      identifier,
      password,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ACCESS_COOKIE_NAME, data.login.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });
    response.cookies.set(REFRESH_COOKIE_NAME, data.login.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    });
    response.cookies.set("moa_locale", locale, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err) {
    console.error("Login Error details:", err);
    return NextResponse.json({ error: "Invalid credentials", details: err instanceof Error ? err.message : String(err) }, { status: 401 });
  }
}

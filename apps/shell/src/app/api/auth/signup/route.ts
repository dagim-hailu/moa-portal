import { NextRequest, NextResponse } from "next/server";
import { runGraphql } from "../../../../lib/graphql";
import {
  ACCESS_COOKIE_NAME,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  normalizeEmail,
  normalizeUsername,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
  validateEmail,
  validatePassword,
  validateUsername,
} from "../../../../lib/auth";

const SIGNUP_MUTATION = `
  mutation Signup($email: String!, $username: String!, $password: String!, $fullName: String, $locale: String) {
    signup(email: $email, username: $username, password: $password, fullName: $fullName, locale: $locale) {
      accessToken
      refreshToken
    }
  }
`;

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    email?: string;
    username?: string;
    password?: string;
    fullName?: string;
    locale?: "en" | "am";
  };

  const email = body.email ? normalizeEmail(body.email) : undefined;
  const username = body.username ? normalizeUsername(body.username) : undefined;
  const password = body.password?.trim();
  const fullName = body.fullName?.trim();
  const locale = body.locale === "am" ? "am" : "en";

  if (
    !email ||
    !username ||
    !password ||
    !fullName ||
    !validateEmail(email) ||
    !validateUsername(username) ||
    !validatePassword(password)
  ) {
    return NextResponse.json({ error: "Invalid signup data" }, { status: 400 });
  }

  try {
    const data = await runGraphql<{ signup: { accessToken: string; refreshToken: string } }>(SIGNUP_MUTATION, {
      email,
      username,
      password,
      fullName,
      locale,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ACCESS_COOKIE_NAME, data.signup.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });
    response.cookies.set(REFRESH_COOKIE_NAME, data.signup.refreshToken, {
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
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Signup failed" },
      { status: 400 },
    );
  }
}

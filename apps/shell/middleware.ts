import { NextRequest, NextResponse } from "next/server";
import { verifyPortalJwt } from "@moa/shared/auth";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "./src/lib/auth";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/contact") ||
    pathname === "/about" ||
    pathname === "/contact" ||
    pathname === "/";

  let payload = null;
  if (token) {
    try {
      payload = await verifyPortalJwt(token, process.env.JWT_SECRET ?? "replace_me");
    } catch {
      if (!isPublicRoute && refreshToken) {
        const refreshUrl = new URL("/api/auth/refresh", request.url);
        refreshUrl.searchParams.set("returnTo", pathname);
        return NextResponse.redirect(refreshUrl);
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Prevent logged-in users from accessing login/signup
  if (payload && (pathname.startsWith("/login") || pathname.startsWith("/signup"))) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (!payload && !isPublicRoute) {
    if (refreshToken) {
      const refreshUrl = new URL("/api/auth/refresh", request.url);
      refreshUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(refreshUrl);
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Handle role-based routing
  if (payload) {
    const roles = payload.roles ?? [];
    const isAdmin = roles.includes("admin");
    const isSupervisor = roles.includes("supervisor");

    if (pathname.startsWith("/admin") && !isAdmin) {
      return NextResponse.rewrite(new URL("/403", request.url));
    }

    if ((pathname.startsWith("/users") || pathname.startsWith("/starter")) && !(isAdmin || isSupervisor)) {
      return NextResponse.rewrite(new URL("/403", request.url));
    }

    // Handle Application permissions
    if (pathname.startsWith("/apps/")) {
      const slug = pathname.split("/")[2];
      const allowed = payload.apps ?? [];
      if (!allowed.includes(slug)) {
        return NextResponse.rewrite(new URL("/403", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health).*)"],
};

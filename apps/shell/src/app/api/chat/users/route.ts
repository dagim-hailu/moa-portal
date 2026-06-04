import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_COOKIE_NAME } from "../../../../lib/auth";
import { getServerHttpBaseUrl } from "../../../../lib/server-http";

export async function GET(req: NextRequest) {
  const token = cookies().get(ACCESS_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q");
  const serverUrl = getServerHttpBaseUrl();
  const url = q ? `${serverUrl}/api/chat/users?q=${encodeURIComponent(q)}` : `${serverUrl}/api/chat/users`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return NextResponse.json({ error: "Failed" }, { status: res.status });
  return NextResponse.json(await res.json());
}

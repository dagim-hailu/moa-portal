import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_COOKIE_NAME } from "../../../../lib/auth";
import { getServerHttpBaseUrl } from "../../../../lib/server-http";

export async function GET() {
  const token = cookies().get(ACCESS_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serverUrl = getServerHttpBaseUrl();
  const res = await fetch(`${serverUrl}/api/chat/rooms`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return NextResponse.json({ error: "Failed" }, { status: res.status });
  return NextResponse.json(await res.json());
}

export async function POST(req: NextRequest) {
  const token = cookies().get(ACCESS_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serverUrl = getServerHttpBaseUrl();
  const body = await req.json();
  const res = await fetch(`${serverUrl}/api/chat/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) return NextResponse.json({ error: "Failed" }, { status: res.status });
  return NextResponse.json(await res.json());
}

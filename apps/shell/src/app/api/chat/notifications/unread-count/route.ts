import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerHttpBaseUrl } from "../../../../../lib/server-http";

export async function GET() {
  const token = cookies().get("moa_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const serverUrl = getServerHttpBaseUrl();
  const res = await fetch(`${serverUrl}/api/chat/notifications/unread-count`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return NextResponse.json({ error: "Failed" }, { status: res.status });
  return NextResponse.json(await res.json());
}

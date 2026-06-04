import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const token = cookies().get("moa_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const serverUrl = process.env.MOA_SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
  const body = await req.json();
  const res = await fetch(`${serverUrl}/api/chat/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("Send message failed:", res.status, err);
    return NextResponse.json({ error: err }, { status: res.status });
  }
  return NextResponse.json(await res.json());
}

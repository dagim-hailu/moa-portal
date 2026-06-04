import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerHttpBaseUrl } from "../../../../../../lib/server-http";

async function proxy(method: string, path: string, body?: unknown) {
  const token = cookies().get("moa_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const serverUrl = getServerHttpBaseUrl();
  const opts: RequestInit = { method, headers: { Authorization: `Bearer ${token}` } };
  if (body) { opts.headers = { ...opts.headers, "Content-Type": "application/json" }; opts.body = JSON.stringify(body); }
  const res = await fetch(`${serverUrl}/api/chat${path}`, opts);
  if (!res.ok) return NextResponse.json({ error: "Failed" }, { status: res.status });
  return NextResponse.json(await res.json());
}

export async function GET(_req: NextRequest, { params }: { params: { roomId: string } }) {
  return proxy("GET", `/rooms/${params.roomId}/members`);
}

export async function POST(req: NextRequest, { params }: { params: { roomId: string } }) {
  return proxy("POST", `/rooms/${params.roomId}/members`, await req.json());
}

export async function DELETE(_req: NextRequest, { params }: { params: { roomId: string } }) {
  const userId = _req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  return proxy("DELETE", `/rooms/${params.roomId}/members/${encodeURIComponent(userId)}`);
}

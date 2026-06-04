import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerHttpBaseUrl } from "../../../../../lib/server-http";

async function proxy(method: string, path: string, body?: unknown) {
  const token = cookies().get("moa_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const serverUrl = getServerHttpBaseUrl();
  const opts: RequestInit = { method, headers: { Authorization: `Bearer ${token}` } };
  if (body) { opts.headers = { ...opts.headers, "Content-Type": "application/json" }; opts.body = JSON.stringify(body); }
  const res = await fetch(`${serverUrl}/api/chat/notifications/${path}`, opts);
  if (!res.ok) return NextResponse.json({ error: "Failed" }, { status: res.status });
  return NextResponse.json(await res.json());
}

export async function PUT() { return proxy("PUT", "read-all"); }

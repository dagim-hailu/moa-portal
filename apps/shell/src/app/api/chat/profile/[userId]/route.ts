import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const token = cookies().get("moa_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serverUrl = process.env.MOA_SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
  const res = await fetch(`${serverUrl}/api/chat/profile/${params.userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Profile proxy failed:", res.status, err);
    return NextResponse.json({ error: "Failed" }, { status: res.status });
  }
  return NextResponse.json(await res.json());
}

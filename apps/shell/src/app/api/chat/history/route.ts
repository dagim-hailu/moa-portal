import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_COOKIE_NAME } from "../../../../lib/auth";
import { getServerHttpBaseUrl } from "../../../../lib/server-http";

export async function GET(req: NextRequest) {
  const token = cookies().get(ACCESS_COOKIE_NAME)?.value;
  const receiverId = req.nextUrl.searchParams.get("receiverId");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serverUrl = getServerHttpBaseUrl();
  
  try {
    const res = await fetch(`${serverUrl}/api/chat/history?receiverId=${receiverId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch history" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Chat history proxy error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

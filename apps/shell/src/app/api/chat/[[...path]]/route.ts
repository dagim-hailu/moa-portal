import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_COOKIE_NAME } from "../../../../lib/auth";
import { getServerHttpBaseUrl } from "../../../../lib/server-http";

export const dynamic = "force-dynamic";

async function proxy(req: NextRequest, { params }: { params: { path?: string[] } }) {
  const token = cookies().get(ACCESS_COOKIE_NAME)?.value || cookies().get("moa_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serverUrl = getServerHttpBaseUrl();
  const path = params.path ? params.path.join("/") : "";
  const query = req.nextUrl.search; // includes the "?"
  
  const targetUrl = `${serverUrl}/api/chat/${path}${query}`;

  const init: RequestInit = {
    method: req.method,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const contentType = req.headers.get("content-type");
    if (contentType?.includes("multipart/form-data")) {
      init.body = await req.formData();
      (init as any).duplex = "half";
    } else {
      init.body = await req.text();
      if (contentType) {
        (init.headers as any)["Content-Type"] = contentType;
      }
    }
  }

  try {
    const res = await fetch(targetUrl, init);
    
    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return NextResponse.json(await res.json(), { status: res.status });
    } else {
      return new NextResponse(await res.text(), { 
        status: res.status, 
        headers: { "Content-Type": contentType || "text/plain" } 
      });
    }
  } catch (e) {
    console.error(`Proxy error for /api/chat/${path}:`, e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;

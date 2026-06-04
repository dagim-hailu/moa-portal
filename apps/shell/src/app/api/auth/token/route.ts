import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const token = cookies().get("moa_token")?.value;
  if (!token) return NextResponse.json({ token: null }, { status: 401 });
  return NextResponse.json({ token });
}

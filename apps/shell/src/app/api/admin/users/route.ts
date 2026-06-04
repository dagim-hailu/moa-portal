import { NextRequest, NextResponse } from "next/server";
import { runGraphql } from "../../../../lib/graphql";
import { ACCESS_COOKIE_NAME } from "../../../../lib/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, slug, userId } = body;
    
    let mutation = "";
    if (action === "assign") {
      mutation = `
        mutation AssignUser($slug: String!, $userId: String!) {
          assignUserToApplication(slug: $slug, userId: $userId) {
            id
          }
        }
      `;
    } else if (action === "revoke") {
      mutation = `
        mutation RevokeUser($slug: String!, $userId: String!) {
          revokeUserFromApplication(slug: $slug, userId: $userId)
        }
      `;
    } else {
      throw new Error("Invalid action");
    }

    const data = await runGraphql<any>(mutation, { slug, userId }, token);
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

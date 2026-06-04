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
    const mutation = `
      mutation RegisterApp($slug: String!, $nameEn: String!, $nameAm: String!, $descriptionEn: String!, $descriptionAm: String!, $routePath: String!, $searchEnabled: Boolean!) {
        registerApplication(
          slug: $slug,
          nameEn: $nameEn,
          nameAm: $nameAm,
          descriptionEn: $descriptionEn,
          descriptionAm: $descriptionAm,
          routePath: $routePath,
          searchEnabled: $searchEnabled
        ) {
          id
        }
      }
    `;
    const data = await runGraphql<any>(mutation, body, token);
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const mutation = `
      mutation ToggleApp($slug: String!, $isActive: Boolean!) {
        toggleApplication(slug: $slug, isActive: $isActive)
      }
    `;
    const data = await runGraphql<any>(mutation, body, token);
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { runGraphql } from "../../../lib/graphql";

const MUTATION = `
  mutation SubmitContact($fullName: String!, $email: String!, $message: String!) {
    submitContact(fullName: $fullName, email: $email, message: $message) {
      success
    }
  }
`;

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { fullName?: string; email?: string; message?: string };
  const fullName = body.fullName?.trim();
  const email = body.email?.trim();
  const message = body.message?.trim();

  if (!fullName || !email || !message) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  try {
    await runGraphql<{ submitContact: { success: boolean } }>(MUTATION, { fullName, email, message });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to send message" }, { status: 500 });
  }
}

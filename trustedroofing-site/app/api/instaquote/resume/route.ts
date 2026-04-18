import { NextResponse } from "next/server";
import { verifyQuoteResumeToken } from "@/lib/quoteResumeToken";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing resume token." }, { status: 400 });
  }

  const payload = verifyQuoteResumeToken(token);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "Invalid or expired resume token." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    requestedScope: payload.requestedScope,
    sidingMaterial: payload.sidingMaterial ?? null,
    estimate: payload.estimate
  });
}

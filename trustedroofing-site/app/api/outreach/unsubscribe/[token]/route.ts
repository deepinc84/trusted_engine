import { NextRequest, NextResponse } from "next/server";
import { suppressByToken } from "@/lib/outreach/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const ok = await suppressByToken(params.token);
    return new NextResponse(`<!doctype html><html><body style="font-family:Arial;padding:40px"><h1>${ok ? "You have been unsubscribed." : "This unsubscribe link is invalid or expired."}</h1><p>${ok ? "You will not receive further outreach from this campaign." : "No changes were made."}</p></body></html>`, {
      status: ok ? 200 : 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch {
    return new NextResponse("Unable to process unsubscribe.", { status: 500 });
  }
}

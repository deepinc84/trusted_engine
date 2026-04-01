import { NextResponse } from "next/server";
import { setInstantQuoteMarketingTag } from "@/lib/db";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const form = await request.formData();
  const isMarketing = String(form.get("is_marketing") ?? "false") === "true";
  try {
    await setInstantQuoteMarketingTag(params.id, isMarketing);
    return NextResponse.redirect(new URL("/admin/instant-quotes", request.url), { status: 303 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update quote tag" }, { status: 400 });
  }
}

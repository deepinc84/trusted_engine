import { NextResponse } from "next/server";
import { createQuoteStep1, updateQuoteStep2 } from "@/lib/db";
import { stripPII } from "@/lib/sanitize";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const step = url.searchParams.get("step");
  const body = await request.json();

  if (step === "1") {
    const required = [
      "address",
      "city",
      "province",
      "postal",
      "lat",
      "lng",
      "estimate_low",
      "estimate_high",
      "service_type",
      "requested_scopes"
    ];
    const missing = required.filter((key) => body[key] === undefined);
    if (missing.length) {
      return NextResponse.json(
        { error: `Missing fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const quoteId = await createQuoteStep1(body);
    return NextResponse.json({ quote_id: quoteId });
  }

  if (step === "2") {
    const required = ["quote_id", "name", "phone", "email", "preferred_contact"];
    const missing = required.filter((key) => body[key] === undefined);
    if (missing.length) {
      return NextResponse.json(
        { error: `Missing fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }
    await updateQuoteStep2(body);
    return NextResponse.json({ ok: true, quote_id: body.quote_id });
  }

  return NextResponse.json(
    {
      error:
        "Unsupported quote step. Use /api/quotes/step1 or /api/quotes/step2."
    },
    { status: 400 }
  );
}

export async function GET() {
  return NextResponse.json({
    message: "Quote endpoint ready.",
    public: stripPII({ status: "ok" })
  });
}

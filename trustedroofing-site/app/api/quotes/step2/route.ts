import { NextResponse } from "next/server";
import { updateQuoteStep2 } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();

  const required = ["quote_id", "name", "email", "phone", "preferred_contact"];
  const missing = required.filter((key) => body[key] === undefined);

  if (missing.length) {
    return NextResponse.json(
      { error: `Missing fields: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  await updateQuoteStep2({
    quote_id: body.quote_id,
    name: body.name,
    email: body.email,
    phone: body.phone,
    preferred_contact: body.preferred_contact
  });

  return NextResponse.json({ ok: true, quote_id: body.quote_id });
}

import { NextResponse } from "next/server";
import { attachInstantQuoteLead } from "@/lib/db";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = requestIp(request);
  const limit = checkRateLimit(`instaquote-save-lead:${ip}`, 12, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const required = ["address", "name", "email", "phone", "budgetResponse", "addressQueryId"];
  const missing = required.filter((key) => !String(body[key] ?? "").trim());
  if (missing.length) {
    return NextResponse.json({ error: `Missing fields: ${missing.join(", ")}` }, { status: 400 });
  }

  const budget = String(body.budgetResponse);
  if (!["yes", "financing", "too_expensive"].includes(budget)) {
    return NextResponse.json({ error: "Invalid budgetResponse" }, { status: 400 });
  }

  const quoteId = String(body.addressQueryId ?? "").trim();
  if (!quoteId) {
    return NextResponse.json({ error: "Missing addressQueryId" }, { status: 400 });
  }

  await attachInstantQuoteLead({
    quote_id: quoteId,
    name: String(body.name),
    email: String(body.email),
    phone: String(body.phone),
    notes: body
  });

  return NextResponse.json({ ok: true });
}

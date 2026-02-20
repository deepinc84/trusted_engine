import { NextResponse } from "next/server";
import { createInstaquoteLead } from "@/lib/db";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = requestIp(request);
  const limit = checkRateLimit(`instaquote-save-lead:${ip}`, 12, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const required = ["address", "name", "email", "phone", "budgetResponse"];
  const missing = required.filter((key) => !String(body[key] ?? "").trim());
  if (missing.length) {
    return NextResponse.json({ error: `Missing fields: ${missing.join(", ")}` }, { status: 400 });
  }

  const budget = String(body.budgetResponse);
  if (!["yes", "financing", "too_expensive"].includes(budget)) {
    return NextResponse.json({ error: "Invalid budgetResponse" }, { status: 400 });
  }

  await createInstaquoteLead({
    address_query_id: (body.addressQueryId as string) || null,
    address: String(body.address),
    place_id: (body.placeId as string) || null,
    lat: typeof body.lat === "number" ? body.lat : null,
    lng: typeof body.lng === "number" ? body.lng : null,
    name: String(body.name),
    email: String(body.email),
    phone: String(body.phone),
    budget_response: budget as "yes" | "financing" | "too_expensive",
    timeline: (body.timeline as string) || null,
    roof_area_sqft: typeof body.roofAreaSqft === "number" ? Math.round(body.roofAreaSqft) : null,
    roof_squares: typeof body.roofSquares === "number" ? body.roofSquares : null,
    pitch: (body.pitch as string) || null,
    good_low: typeof body.goodLow === "number" ? body.goodLow : null,
    good_high: typeof body.goodHigh === "number" ? body.goodHigh : null,
    better_low: typeof body.betterLow === "number" ? body.betterLow : null,
    better_high: typeof body.betterHigh === "number" ? body.betterHigh : null,
    best_low: typeof body.bestLow === "number" ? body.bestLow : null,
    best_high: typeof body.bestHigh === "number" ? body.bestHigh : null,
    eaves_low: typeof body.eavesLow === "number" ? body.eavesLow : null,
    eaves_high: typeof body.eavesHigh === "number" ? body.eavesHigh : null,
    siding_low: typeof body.sidingLow === "number" ? body.sidingLow : null,
    siding_high: typeof body.sidingHigh === "number" ? body.sidingHigh : null,
    lead_score: typeof body.leadScore === "number" ? body.leadScore : null,
    lead_grade: typeof body.leadGrade === "string" ? body.leadGrade : null,
    data_source: typeof body.dataSource === "string" ? body.dataSource : null,
    email_sent_at: null,
    raw_json: body
  });

  return NextResponse.json({ ok: true });
}

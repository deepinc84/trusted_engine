import { NextResponse } from "next/server";
import { createInstaquoteRegionalFeedback } from "@/lib/db";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = requestIp(request);
  const limit = checkRateLimit(`instaquote-feedback:${ip}`, 20, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  await createInstaquoteRegionalFeedback({
    address: (body.address as string) ?? null,
    place_id: (body.placeId as string) ?? null,
    lat: typeof body.lat === "number" ? body.lat : null,
    lng: typeof body.lng === "number" ? body.lng : null,
    base_sqft: typeof body.baseSqft === "number" ? Math.round(body.baseSqft) : null,
    shown_sqft: typeof body.shownSqft === "number" ? Math.round(body.shownSqft) : null,
    final_sqft: typeof body.finalSqft === "number" ? Math.round(body.finalSqft) : null,
    size_choice: (body.sizeChoice as string) ?? null,
    complexity_choice: (body.complexityChoice as string) ?? null,
    reason: (body.reason as string) ?? null
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { createQuoteStep1 } from "@/lib/db";
import { roundLatLng } from "@/lib/sanitize";

export async function POST(request: Request) {
  const body = await request.json();

  const required = [
    "service_slug",
    "address_private",
    "lat_private",
    "lng_private",
    "estimate_low",
    "estimate_high"
  ];
  const missing = required.filter((key) => body[key] === undefined);
  if (missing.length) {
    return NextResponse.json(
      { error: `Missing fields: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  const rounded = roundLatLng(body.lat_private ?? null, body.lng_private ?? null, 3);

  const quoteId = await createQuoteStep1({
    service_slug: body.service_slug ?? null,
    place_id: body.place_id ?? null,
    address_private: body.address_private ?? null,
    lat_private: body.lat_private ?? null,
    lng_private: body.lng_private ?? null,
    lat_public: rounded.lat,
    lng_public: rounded.lng,
    estimate_low: body.estimate_low ?? null,
    estimate_high: body.estimate_high ?? null,
    status: "step1"
  });

  return NextResponse.json({ quote_id: quoteId });
}

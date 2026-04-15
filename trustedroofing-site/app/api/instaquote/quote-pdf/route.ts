import { NextResponse } from "next/server";
import { listRecentInstaquoteAddressQueries } from "@/lib/db";
import { haversineKm } from "@/lib/geo";
import { buildPublicQuoteDisplay } from "@/lib/publicQuoteDisplay";

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildPdf(lines: string[]) {
  const contentLines = [
    "BT",
    "/F1 11 Tf",
    "40 800 Td"
  ];

  lines.forEach((line, index) => {
    const safe = escapePdfText(line);
    if (index === 0) {
      contentLines.push(`(${safe}) Tj`);
    } else {
      contentLines.push("T*");
      contentLines.push(`(${safe}) Tj`);
    }
  });
  contentLines.push("ET");

  const stream = contentLines.join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${Buffer.byteLength(stream, "utf8")} >> stream\n${stream}\nendstream endobj`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${object}\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const estimate = body.estimate as {
      address?: string;
      lat?: number | null;
      lng?: number | null;
      roofAreaSqft?: number;
      pitchRatio?: string | null;
      complexityBand?: string;
      dataSource?: string;
      ranges?: { good?: { low?: number; high?: number } };
      extras?: {
        eavesLf?: number;
        sidingSqft?: number;
        eaves?: { low?: number; high?: number };
        sidingVinyl?: { low?: number; high?: number };
        sidingHardie?: { low?: number; high?: number };
      };
    };
    const requestedScope = String(body.requestedScope ?? "roofing");
    const primaryLow = Number(body.primaryLow ?? 0);
    const primaryHigh = Number(body.primaryHigh ?? 0);
    const material = requestedScope === "hardie_siding"
      ? "Hardie board"
      : requestedScope === "vinyl_siding"
        ? "Vinyl siding"
        : null;
    const publicQuoteDisplay = buildPublicQuoteDisplay({
      selectedScope: requestedScope,
      roofAreaSqft: estimate.roofAreaSqft,
      pitchRatio: estimate.pitchRatio,
      complexityBand: estimate.complexityBand,
      dataSource: estimate.dataSource,
      eavesLengthLf: estimate.extras?.eavesLf,
      stories: 2,
      material
    });

    const rows = await listRecentInstaquoteAddressQueries(500);
    const nearby = rows.filter((row) =>
      typeof row.lat === "number" &&
      typeof row.lng === "number" &&
      typeof estimate.lat === "number" &&
      typeof estimate.lng === "number" &&
      haversineKm(estimate.lat, estimate.lng, row.lat, row.lng) <= 5
    );
    const similarSize = rows.filter((row) =>
      typeof row.roof_area_sqft === "number" &&
      typeof estimate.roofAreaSqft === "number" &&
      row.roof_area_sqft >= estimate.roofAreaSqft * 0.85 &&
      row.roof_area_sqft <= estimate.roofAreaSqft * 1.15
    );

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const lines = [
      "Trusted Roofing & Exteriors - Instant Estimate Snapshot",
      `Generated: ${now}`,
      "",
      `Address: ${estimate.address ?? "Not provided"}`,
      `Requested scope: ${requestedScope}`,
      `Estimated range: $${primaryLow.toLocaleString()} - $${primaryHigh.toLocaleString()}`,
      "",
      "Additional scope ranges",
      `Roofing: $${Number(estimate.ranges?.good?.low ?? 0).toLocaleString()} - $${Number(estimate.ranges?.good?.high ?? 0).toLocaleString()}`,
      `Vinyl siding: $${Number(estimate.extras?.sidingVinyl?.low ?? 0).toLocaleString()} - $${Number(estimate.extras?.sidingVinyl?.high ?? 0).toLocaleString()}`,
      `Hardie siding: $${Number(estimate.extras?.sidingHardie?.low ?? 0).toLocaleString()} - $${Number(estimate.extras?.sidingHardie?.high ?? 0).toLocaleString()}`,
      `Eavestrough: $${Number(estimate.extras?.eaves?.low ?? 0).toLocaleString()} - $${Number(estimate.extras?.eaves?.high ?? 0).toLocaleString()}`,
      "",
      "Local context",
      `Homes near you quoted recently (within ~5km): ${nearby.length}`,
      `Similar-sized properties quoted (±15% area): ${similarSize.length}`,
      "",
      "Estimate details",
      ...publicQuoteDisplay.supportingItems.map((item) => `${item.label}: ${item.value}`)
    ];

    const pdf = buildPdf(lines);
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"instant-estimate-${Date.now()}.pdf\"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate PDF." },
      { status: 400 }
    );
  }
}
